from uuid import UUID

from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructures.guardrails import guardrails_service
from app.infrastructures.redis.service import redis_service
from app.modules.auth.models import User
from app.modules.jobs.models import Job
from app.modules.resume_gap.helpers import filter_grounded
from app.modules.resume_gap.providers.groq_provider import GroqGapAnalysisProvider
from app.modules.resume_gap.schemas import (
    AutoPatchRequest,
    AutoPatchResponse,
    GapAnalysisRequest,
    GapAnalysisResult,
    PatchedFieldDiff,
)
from app.modules.resumes import service as resumes_service
from app.modules.resumes.models import Resume
from app.modules.resumes.schemas import ResumeUpdate
from app.shared.schemas import EducationBase, ExperienceBase, SkillBase

_provider = GroqGapAnalysisProvider()
CACHE_TTL_SECONDS = 600
PENDING_PATCH_TTL_SECONDS = 1800


def _pending_patch_key(user_id: UUID, resume_id: UUID, job_id: UUID) -> str:
    """Redis key for an un-applied resume patch awaiting final apply confirmation."""
    return f"resume_patch_pending:{user_id}:{resume_id}:{job_id}"


async def consume_pending_patch(
    db: AsyncSession,
    user: User,
    resume_id: UUID,
    job_id: UUID,
) -> bool:
    """Apply a pending resume patch and clear it. Returns True if a patch was applied."""
    key = _pending_patch_key(user.id, resume_id, job_id)
    cached = await redis_service.get(key)
    if not cached:
        return False
    try:
        update = ResumeUpdate.model_validate_json(cached)
    except Exception:
        await redis_service.delete(key)
        return False
    await resumes_service.update_resume(db, user, str(resume_id), update)
    await redis_service.delete(key)
    await redis_service.delete(f"resume_gap:{resume_id}:{job_id}")
    return True


async def discard_pending_patch(
    user: User,
    resume_id: UUID,
    job_id: UUID,
) -> None:
    """Discard a pending resume patch (e.g., user abandoned the apply flow)."""
    await redis_service.delete(_pending_patch_key(user.id, resume_id, job_id))


def _resume_text_for_guardrails(resume: Resume) -> str:
    """Flatten the resume's free-text fields into a single string for the input rail."""
    parts: list[str] = []
    if resume.headline:
        parts.append(str(resume.headline))
    if resume.summary:
        parts.append(str(resume.summary))
    for experience in resume.experiences:
        if experience.title:
            parts.append(str(experience.title))
        if experience.company_name:
            parts.append(str(experience.company_name))
        for bullet in experience.description or []:
            parts.append(str(bullet))
    return "\n".join(parts)


def _serialize_resume(resume: Resume) -> dict:
    """Serialize a resume into the gap-analysis provider payload format."""
    return {
        "headline": resume.headline,
        "summary": resume.summary,
        "years_of_experience": resume.years_of_experience,
        "location": resume.location,
        "skills": [skill.skill_name for skill in resume.skills],
        "experiences": [
            {
                "index": idx,
                "company": experience.company_name,
                "title": experience.title,
                "start": str(experience.start_date) if experience.start_date else None,
                "end": str(experience.end_date) if experience.end_date else "present",
                "description": experience.description or [],
            }
            for idx, experience in enumerate(resume.experiences)
        ],
        "educations": [
            {
                "index": idx,
                "institution": education.institution,
                "degree": education.degree,
                "field": education.field_of_study,
            }
            for idx, education in enumerate(resume.educations)
        ],
    }


def _serialize_job(job: Job) -> dict:
    """Serialize a job into the gap-analysis provider payload format."""
    return {
        "title": job.title,
        "overview": job.overview or "",
        "requirements": job.requirements or [],
        "preferred_qualifications": job.preferred_qualifications or [],
        "responsibilities": job.responsibilities or [],
    }


async def _load_resume(db: AsyncSession, resume_id: UUID, user_id: UUID) -> Resume:
    """Load a user-owned resume with all fields needed for analysis."""
    result = await db.execute(
        select(Resume)
        .where(Resume.id == resume_id, Resume.user_id == user_id)
        .options(
            selectinload(Resume.experiences),
            selectinload(Resume.educations),
            selectinload(Resume.skills),
        )
    )
    resume = result.scalar_one_or_none()
    if resume is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or access denied.",
        )
    return resume


async def _load_job(db: AsyncSession, job_id: UUID) -> Job:
    """Load a job referenced during gap analysis."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found.",
        )
    return job


async def analyze_gaps(
    db: AsyncSession,
    user: User,
    payload: GapAnalysisRequest,
) -> GapAnalysisResult:
    """Run gap analysis for a resume against a target job."""
    cache_key = f"resume_gap:{payload.resume_id}:{payload.job_id}"
    cached = await redis_service.get(cache_key)
    if cached:
        return GapAnalysisResult.model_validate_json(cached)

    resume = await _load_resume(db, payload.resume_id, user.id)
    job = await _load_job(db, payload.job_id)

    # Pre-flight prompt-injection check on candidate-controlled resume text.
    # Block before the gap-analysis LLM ever sees it.
    await guardrails_service.assert_input_safe(
        _resume_text_for_guardrails(resume),
        source="resume_gap.analyze",
    )

    resume_payload = _serialize_resume(resume)
    job_payload = _serialize_job(job)

    result = await _provider.analyze_gaps(
        resume_data=resume_payload,
        job_data=job_payload,
    )

    missing_kept, missing_dropped = filter_grounded(
        result.missing_skills, resume_payload, job_payload
    )
    gaps_kept, gaps_dropped = filter_grounded(
        result.experience_gaps, resume_payload, job_payload
    )
    if missing_dropped or gaps_dropped:
        logger.warning(
            "resume_gap grounding | resume_id={} job_id={} dropped_missing={} dropped_gaps={}",
            payload.resume_id,
            payload.job_id,
            [item.area for item in missing_dropped],
            [item.area for item in gaps_dropped],
        )
    result.missing_skills = missing_kept
    result.experience_gaps = gaps_kept

    await redis_service.set(
        cache_key,
        result.model_dump_json(),
        ttl_seconds=CACHE_TTL_SECONDS,
    )
    return result


async def auto_patch_resume(
    db: AsyncSession,
    user: User,
    payload: AutoPatchRequest,
) -> AutoPatchResponse:
    """Apply provider-generated resume improvements and invalidate caches."""
    resume = await _load_resume(db, payload.resume_id, user.id)

    # Same input rail as analyze_gaps — patch-build also feeds resume text to LLM.
    await guardrails_service.assert_input_safe(
        _resume_text_for_guardrails(resume),
        source="resume_gap.auto_patch",
    )

    patch = await _provider.build_patch(
        resume_data=_serialize_resume(resume),
        gap_result=payload.gap_result,
    )
    logger.info(
        "auto_patch raw LLM output | resume_id={} headline_len={} summary_len={} "
        "skills={} experience_patches={} headline_preview={!r} summary_preview={!r}",
        payload.resume_id,
        len(patch.headline),
        len(patch.summary),
        len(patch.skills),
        [(p.index, len(p.description)) for p in patch.experience_patches],
        patch.headline[:80],
        patch.summary[:120],
    )

    existing_skills = [skill.skill_name for skill in resume.skills]
    existing_by_lower = {s.strip().lower(): s for s in existing_skills}
    merged_skills: list[SkillBase] = []
    seen: set[str] = set()
    added_skill_names: list[str] = []
    MAX_NEW_SKILLS = 5
    MAX_TOTAL_SKILLS = 30
    for skill_name in patch.skills:
        normalized = skill_name.strip()
        if not normalized:
            continue
        key = normalized.lower()
        if key in seen:
            continue
        if key in existing_by_lower:
            seen.add(key)
            merged_skills.append(SkillBase(skill_name=existing_by_lower[key]))
        else:
            if len(added_skill_names) >= MAX_NEW_SKILLS:
                continue
            seen.add(key)
            merged_skills.append(SkillBase(skill_name=normalized))
            added_skill_names.append(normalized)
        if len(merged_skills) >= MAX_TOTAL_SKILLS:
            break
    for original in existing_skills:
        key = original.strip().lower()
        if key and key not in seen:
            seen.add(key)
            merged_skills.append(SkillBase(skill_name=original))

    new_headline = patch.headline.strip()[:120]
    new_summary = patch.summary.strip()[:400]
    current_headline = (resume.headline or "").strip()
    current_summary = (resume.summary or "").strip()

    # Apply experience patches by index. Preserve company/title/dates verbatim;
    # only the description bullet list is replaced.
    experience_count = len(resume.experiences)
    patched_descriptions: dict[int, list[str]] = {}
    for exp_patch in patch.experience_patches:
        if exp_patch.index < 0 or exp_patch.index >= experience_count:
            continue
        cleaned_bullets = [
            bullet.strip()[:220]
            for bullet in exp_patch.description
            if bullet and bullet.strip()
        ][:6]
        if not cleaned_bullets:
            continue
        existing_bullets = list(resume.experiences[exp_patch.index].description or [])
        if cleaned_bullets == existing_bullets:
            continue
        patched_descriptions[exp_patch.index] = cleaned_bullets

    merged_skill_names = [s.skill_name for s in merged_skills]
    skills_changed = merged_skill_names != existing_skills

    updated_fields: list[str] = []
    if new_headline and new_headline != current_headline:
        updated_fields.append("headline")
    if new_summary and new_summary != current_summary:
        updated_fields.append("summary")
    if skills_changed:
        updated_fields.append("skills")
    if patched_descriptions:
        updated_fields.append("experiences")

    if updated_fields:
        rebuilt_experiences = [
            ExperienceBase(
                company_name=experience.company_name,
                title=experience.title,
                start_date=experience.start_date,
                end_date=experience.end_date,
                description=patched_descriptions.get(
                    idx, list(experience.description or [])
                ),
            )
            for idx, experience in enumerate(resume.experiences)
        ]
        rebuilt_educations = [
            EducationBase(
                institution=education.institution,
                degree=education.degree,
                field_of_study=education.field_of_study,
                start_date=education.start_date,
                end_date=education.end_date,
            )
            for education in resume.educations
        ]
        pending_update = ResumeUpdate(
            headline=new_headline if "headline" in updated_fields else resume.headline,
            summary=new_summary if "summary" in updated_fields else resume.summary,
            skills=merged_skills,
            experiences=rebuilt_experiences,
            educations=rebuilt_educations,
        )
        await redis_service.set(
            _pending_patch_key(user.id, payload.resume_id, payload.job_id),
            pending_update.model_dump_json(exclude_unset=True),
            ttl_seconds=PENDING_PATCH_TTL_SECONDS,
        )

    diffs: list[PatchedFieldDiff] = []
    if "headline" in updated_fields:
        diffs.append(
            PatchedFieldDiff(
                field="headline",
                label="Professional headline",
                old_value=resume.headline,
                new_value=new_headline,
            )
        )
    if "summary" in updated_fields:
        diffs.append(
            PatchedFieldDiff(
                field="summary",
                label="Profile summary",
                old_value=resume.summary,
                new_value=new_summary,
            )
        )
    for idx, new_bullets in patched_descriptions.items():
        experience = resume.experiences[idx]
        old_bullets = list(experience.description or [])
        label = f"Experience: {experience.title} @ {experience.company_name}"
        diffs.append(
            PatchedFieldDiff(
                field=f"experience_{idx}",
                label=label,
                old_value="\n".join(old_bullets) if old_bullets else None,
                new_value="\n".join(new_bullets),
            )
        )
    if "skills" in updated_fields:
        old_skills_value = ", ".join(existing_skills) if existing_skills else None
        new_skills_value = ", ".join(merged_skill_names)
        diffs.append(
            PatchedFieldDiff(
                field="skills",
                label="Skills",
                old_value=old_skills_value,
                new_value=new_skills_value,
            )
        )

    return AutoPatchResponse(
        updated_fields=updated_fields,
        message=(
            f"Updated: {', '.join(updated_fields)}."
            if updated_fields
            else "Resume already well-aligned - no changes needed."
        ),
        diffs=diffs,
    )

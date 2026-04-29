from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructures.redis.service import redis_service
from app.modules.auth.models import User
from app.modules.jobs.models import Job
from app.modules.resume_gap.providers.groq_provider import GroqGapAnalysisProvider
from app.modules.resume_gap.schemas import (
    AutoPatchRequest,
    AutoPatchResponse,
    GapAnalysisRequest,
    GapAnalysisResult,
)
from app.modules.resumes import service as resumes_service
from app.modules.resumes.models import Resume
from app.modules.resumes.schemas import ResumeUpdate
from app.shared.schemas import SkillBase

_provider = GroqGapAnalysisProvider()
CACHE_TTL_SECONDS = 600


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
                "company": experience.company_name,
                "title": experience.title,
                "start": str(experience.start_date) if experience.start_date else None,
                "end": str(experience.end_date) if experience.end_date else "present",
                "description": experience.description or [],
            }
            for experience in resume.experiences
        ],
        "educations": [
            {
                "institution": education.institution,
                "degree": education.degree,
                "field": education.field_of_study,
            }
            for education in resume.educations
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

    result = await _provider.analyze_gaps(
        resume_data=_serialize_resume(resume),
        job_data=_serialize_job(job),
    )
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
    patch = await _provider.build_patch(
        resume_data=_serialize_resume(resume),
        gap_result=payload.gap_result,
    )

    existing_skills = [skill.skill_name for skill in resume.skills]
    seen = {skill_name.strip().lower() for skill_name in existing_skills}
    merged_skills: list[SkillBase] = [SkillBase(skill_name=s) for s in existing_skills]
    added_skill_names: list[str] = []
    for skill_name in patch.skills_to_add:
        normalized = skill_name.strip()
        if not normalized or normalized.lower() in seen:
            continue
        seen.add(normalized.lower())
        merged_skills.append(SkillBase(skill_name=normalized))
        added_skill_names.append(normalized)
        if len(added_skill_names) >= 5:
            break

    updated_fields: list[str] = []
    if patch.headline != (resume.headline or ""):
        updated_fields.append("headline")
    if patch.summary != (resume.summary or ""):
        updated_fields.append("summary")
    if added_skill_names:
        updated_fields.append("skills")

    await resumes_service.update_resume(
        db,
        user,
        str(payload.resume_id),
        ResumeUpdate(
            headline=patch.headline,
            summary=patch.summary,
            skills=merged_skills,
        ),
    )
    await redis_service.delete(f"resume_gap:{payload.resume_id}:{payload.job_id}")

    return AutoPatchResponse(
        updated_fields=updated_fields,
        message=(
            f"Updated: {', '.join(updated_fields)}."
            if updated_fields
            else "Resume already well-aligned - no changes needed."
        ),
    )

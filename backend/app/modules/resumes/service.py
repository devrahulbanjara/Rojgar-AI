from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.cache import (
    get_resume_application_ids,
    invalidate_application_candidate_detail_caches,
    invalidate_resume_caches,
)
from app.core.swr_cache import swr_get
from app.modules.applications.models import Application
from app.modules.applications.sync import enqueue_application_sync_events
from app.modules.auth.models import User
from app.modules.profiles.models import Profile
from app.modules.resumes.models import (
    Resume,
    ResumeEducation,
    ResumeExperience,
    ResumeSkill,
)
from app.modules.resumes.schemas import ResumeListItem, ResumeResponse, ResumeUpdate
from app.shared.enums import SyncAction
from app.shared.schemas import EducationResponse, ExperienceResponse, SkillResponse


def _resume_list_cache_key(user_id: str) -> str:
    """Build the cache key for a user's resume list."""
    return f"resumes:list:{user_id}"


def _resume_detail_cache_key(user_id: str, resume_id: str) -> str:
    """Build the cache key for one resume detail view."""
    return f"resume:detail:{resume_id}:user:{user_id}"


async def _load_full_resume(db: AsyncSession, resume_id) -> Resume:
    """Load a resume with all related collections eagerly."""
    result = await db.execute(
        select(Resume)
        .where(Resume.id == resume_id)
        .options(
            selectinload(Resume.experiences),
            selectinload(Resume.educations),
            selectinload(Resume.skills),
        )
    )
    return result.scalar_one()


def _resume_to_response(resume: Resume) -> ResumeResponse:
    """Convert a Resume ORM instance to a response schema."""
    return ResumeResponse(
        id=resume.id,
        user_id=resume.user_id,
        resume_name=resume.resume_name,
        headline=resume.headline,
        summary=resume.summary,
        phone=resume.phone,
        location=resume.location,
        linkedin_url=resume.linkedin_url,
        github_url=resume.github_url,
        portfolio_url=resume.portfolio_url,
        years_of_experience=resume.years_of_experience,
        experiences=[ExperienceResponse.model_validate(e) for e in resume.experiences],
        educations=[EducationResponse.model_validate(e) for e in resume.educations],
        skills=[SkillResponse.model_validate(s) for s in resume.skills],
        created_at=resume.created_at,
        updated_at=resume.updated_at,
    )


async def list_resumes(db: AsyncSession, user: User) -> list[ResumeListItem]:
    """List all resumes for a user (lightweight, no child collections)."""
    return await list_resumes_by_user_id(db, user.id)


async def _build_resume_list(db: AsyncSession, user_id) -> list[ResumeListItem]:
    """Run the query that produces a user's resume list."""
    result = await db.execute(
        select(Resume)
        .where(Resume.user_id == user_id)
        .order_by(Resume.updated_at.desc())
    )
    resumes = result.scalars().all()
    return [
        ResumeListItem(
            id=resume.id,
            resume_name=resume.resume_name,
            created_at=resume.created_at,
            updated_at=resume.updated_at,
        )
        for resume in resumes
    ]


async def list_resumes_by_user_id(db: AsyncSession, user_id) -> list[ResumeListItem]:
    """List all resumes for a user ID (SWR-cached, lightweight)."""
    cache_key = _resume_list_cache_key(str(user_id))

    async def _load(db: AsyncSession = db) -> list:
        items = await _build_resume_list(db, user_id)
        return [item.model_dump(mode="json") for item in items]

    payload = await swr_get(cache_key, _load, soft_ttl=180, hard_ttl=900)
    return [ResumeListItem.model_validate(item) for item in payload]


async def fork_resume_from_profile(
    db: AsyncSession, user: User, resume_name: str, fork_from_profile: bool = True
) -> ResumeResponse:
    """Create a new resume, optionally pre-filled from the user's profile."""
    profile = None
    if fork_from_profile:
        result = await db.execute(
            select(Profile)
            .where(Profile.user_id == user.id)
            .options(
                selectinload(Profile.experiences),
                selectinload(Profile.educations),
                selectinload(Profile.skills),
            )
        )
        profile = result.scalar_one_or_none()

    # Create resume — copy profile fields only when forking
    resume = Resume(
        user_id=user.id,
        resume_name=resume_name,
        headline=profile.headline if profile else None,
        summary=profile.summary if profile else None,
        phone=profile.phone if profile else None,
        location=profile.location if profile else None,
        linkedin_url=profile.linkedin_url if profile else None,
        github_url=profile.github_url if profile else None,
        portfolio_url=profile.portfolio_url if profile else None,
        years_of_experience=profile.years_of_experience if profile else None,
    )
    db.add(resume)
    await db.flush()

    # Copy child collections from profile only when forking
    if profile:
        for exp in profile.experiences:
            db.add(
                ResumeExperience(
                    resume_id=resume.id,
                    company_name=exp.company_name,
                    title=exp.title,
                    start_date=exp.start_date,
                    end_date=exp.end_date,
                    description=exp.description,
                )
            )
        for edu in profile.educations:
            db.add(
                ResumeEducation(
                    resume_id=resume.id,
                    institution=edu.institution,
                    degree=edu.degree,
                    field_of_study=edu.field_of_study,
                    start_date=edu.start_date,
                    end_date=edu.end_date,
                )
            )
        for skill in profile.skills:
            db.add(
                ResumeSkill(
                    resume_id=resume.id,
                    skill_name=skill.skill_name,
                )
            )

    await db.commit()
    resume = await _load_full_resume(db, resume.id)
    await invalidate_resume_caches(str(user.id), str(resume.id))
    if fork_from_profile:
        logger.info(f"Forked resume '{resume_name}' from profile for user {user.id}")
    else:
        logger.info(f"Created blank resume '{resume_name}' for user {user.id}")
    return _resume_to_response(resume)


async def _build_resume_detail(
    db: AsyncSession, user_id, resume_id: str
) -> ResumeResponse:
    """Run the query that produces a resume detail response."""
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
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )
    return _resume_to_response(resume)


async def get_resume(db: AsyncSession, user: User, resume_id: str) -> ResumeResponse:
    """Fetch a specific resume owned by the user (SWR-cached)."""
    cache_key = _resume_detail_cache_key(str(user.id), resume_id)

    async def _load() -> dict:
        response = await _build_resume_detail(db, user.id, resume_id)
        return response.model_dump(mode="json")

    payload = await swr_get(cache_key, _load, soft_ttl=180, hard_ttl=900)
    return ResumeResponse.model_validate(payload)


async def update_resume(
    db: AsyncSession, user: User, resume_id: str, payload: ResumeUpdate
) -> ResumeResponse:
    """Update a resume's scalar fields and/or child collections."""
    result = await db.execute(
        select(Resume)
        .where(Resume.id == resume_id, Resume.user_id == user.id)
        .options(
            selectinload(Resume.experiences),
            selectinload(Resume.educations),
            selectinload(Resume.skills),
        )
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )

    # Scalar fields — only apply fields explicitly sent in the request
    update_data = payload.model_dump(
        exclude_unset=True,
        exclude={"experiences", "educations", "skills"},
    )
    for field, value in update_data.items():
        setattr(resume, field, value)

    # 2. Wipe and replace collections — SQLAlchemy delete-orphan handles DB cleanup
    if payload.experiences is not None:
        resume.experiences = [
            ResumeExperience(**exp.model_dump()) for exp in payload.experiences
        ]

    if payload.educations is not None:
        resume.educations = [
            ResumeEducation(**edu.model_dump()) for edu in payload.educations
        ]

    if payload.skills is not None:
        resume.skills = [ResumeSkill(**skill.model_dump()) for skill in payload.skills]

    linked_application_ids = list(
        await db.scalars(
            select(Application.id).where(Application.resume_id == resume.id)
        )
    )
    enqueue_application_sync_events(db, linked_application_ids, SyncAction.UPSERT)
    await db.commit()
    resume = await _load_full_resume(db, resume.id)
    await invalidate_resume_caches(str(user.id), str(resume.id))
    await invalidate_application_candidate_detail_caches(
        [str(application_id) for application_id in linked_application_ids]
    )
    logger.info(f"Updated resume {resume_id} for user {user.id}")
    return _resume_to_response(resume)


async def create_resume_from_import(
    db: AsyncSession,
    user: User,
    resume_name: str,
    payload: ResumeUpdate,
) -> ResumeResponse:
    """Create a new resume directly from a structured payload."""
    resume = Resume(
        user_id=user.id,
        resume_name=resume_name,
        headline=payload.headline,
        summary=payload.summary,
        phone=payload.phone,
        location=payload.location,
        linkedin_url=payload.linkedin_url,
        github_url=payload.github_url,
        portfolio_url=payload.portfolio_url,
        years_of_experience=payload.years_of_experience,
    )
    db.add(resume)
    await db.flush()

    if payload.experiences is not None:
        for experience in payload.experiences:
            db.add(ResumeExperience(resume_id=resume.id, **experience.model_dump()))

    if payload.educations is not None:
        for education in payload.educations:
            db.add(ResumeEducation(resume_id=resume.id, **education.model_dump()))

    if payload.skills is not None:
        for skill in payload.skills:
            db.add(ResumeSkill(resume_id=resume.id, **skill.model_dump()))

    await db.commit()
    resume = await _load_full_resume(db, resume.id)
    await invalidate_resume_caches(str(user.id), str(resume.id))
    logger.info("Created AI-imported resume '{}' for user {}", resume_name, user.id)
    return _resume_to_response(resume)


async def create_resume_from_payload(
    db: AsyncSession,
    user: User,
    resume_name: str,
    payload: ResumeUpdate,
) -> ResumeResponse:
    """Backward-compatible alias for create_resume_from_import."""
    return await create_resume_from_import(db, user, resume_name, payload)


async def delete_resume(db: AsyncSession, user: User, resume_id: str) -> None:
    """Delete a resume owned by the user."""
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )
    linked_application_ids = await get_resume_application_ids(db, resume_id)
    await db.delete(resume)
    await db.commit()
    await invalidate_resume_caches(str(user.id), resume_id)
    await invalidate_application_candidate_detail_caches(linked_application_ids)
    logger.info(f"Deleted resume {resume_id} for user {user.id}")

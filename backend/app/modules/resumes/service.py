from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.auth.models import User
from app.modules.profiles.models import Profile
from app.modules.resumes.models import (
    Resume,
    ResumeEducation,
    ResumeExperience,
    ResumeSkill,
)
from app.modules.resumes.schemas import ResumeListItem, ResumeResponse, ResumeUpdate


async def _load_full_resume(db: AsyncSession, resume_id) -> Resume:
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
    return ResumeResponse.model_validate(resume)


async def list_resumes(db: AsyncSession, user: User) -> list[ResumeListItem]:
    """List all resumes for a user (lightweight, no child collections)."""
    result = await db.execute(
        select(Resume)
        .where(Resume.user_id == user.id)
        .order_by(Resume.updated_at.desc())
    )
    resumes = result.scalars().all()
    return [ResumeListItem.model_validate(r) for r in resumes]


async def fork_resume_from_profile(
    db: AsyncSession, user: User, resume_name: str
) -> ResumeResponse:
    """Create a new resume by copying data from the user's profile."""
    # Load the user's profile with children
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

    # Create resume — copy profile fields if profile exists
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

    # Copy child collections from profile
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
    logger.info(f"Forked resume '{resume_name}' for user {user.id}")
    return _resume_to_response(resume)


async def get_resume(db: AsyncSession, user: User, resume_id: str) -> ResumeResponse:
    """Fetch a specific resume owned by the user."""
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
    return _resume_to_response(resume)


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

    await db.commit()
    resume = await _load_full_resume(db, resume.id)
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
        resume.experiences = [
            ResumeExperience(**experience.model_dump())
            for experience in payload.experiences
        ]

    if payload.educations is not None:
        resume.educations = [
            ResumeEducation(**education.model_dump())
            for education in payload.educations
        ]

    if payload.skills is not None:
        resume.skills = [ResumeSkill(**skill.model_dump()) for skill in payload.skills]

    await db.commit()
    resume = await _load_full_resume(db, resume.id)
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
    await db.delete(resume)
    await db.commit()
    logger.info(f"Deleted resume {resume_id} for user {user.id}")

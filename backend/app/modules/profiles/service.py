from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.auth.models import User
from app.modules.profiles.models import (
    Profile,
    ProfileEducation,
    ProfileExperience,
    ProfileSkill,
)
from app.modules.profiles.schemas import ProfileResponse, ProfileUpdate


async def _load_full_profile(db: AsyncSession, profile_id) -> Profile:
    """Load a profile with all related collections eagerly."""
    result = await db.execute(
        select(Profile)
        .where(Profile.id == profile_id)
        .options(
            selectinload(Profile.experiences),
            selectinload(Profile.educations),
            selectinload(Profile.skills),
        )
    )
    return result.scalar_one()


def _profile_to_response(profile: Profile) -> ProfileResponse:
    """Convert a Profile ORM instance to a response schema."""
    return ProfileResponse.model_validate(profile)


async def get_or_create_profile(db: AsyncSession, user: User) -> ProfileResponse:
    """Return the user's profile, creating an empty one if it does not exist."""
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

    if not profile:
        profile = Profile(user_id=user.id)
        db.add(profile)
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            # Another request beat us — just fetch the profile
            result = await db.execute(select(Profile).where(Profile.user_id == user.id))
            profile = result.scalar_one()
        profile = await _load_full_profile(db, profile.id)
        logger.info(f"Created empty profile for user {user.id}")

    return _profile_to_response(profile)


async def update_profile(
    db: AsyncSession, user: User, payload: ProfileUpdate
) -> ProfileResponse:
    """Update the candidate's profile using upsert logic for child collections."""
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
    if not profile:
        profile = Profile(user_id=user.id)
        db.add(profile)
        await db.flush()

    update_data = payload.model_dump(
        exclude_unset=True, exclude={"experiences", "educations", "skills"}
    )
    for field, value in update_data.items():
        setattr(profile, field, value)

    if payload.experiences is not None:
        profile.experiences = [
            ProfileExperience(**exp.model_dump()) for exp in payload.experiences
        ]

    if payload.educations is not None:
        profile.educations = [
            ProfileEducation(**edu.model_dump()) for edu in payload.educations
        ]

    if payload.skills is not None:
        profile.skills = [
            ProfileSkill(**skill.model_dump()) for skill in payload.skills
        ]

    await db.commit()
    profile = await _load_full_profile(db, profile.id)
    logger.info(f"Updated profile for user {user.id}")
    return _profile_to_response(profile)


async def get_profile_by_user_id(db: AsyncSession, user_id: str) -> ProfileResponse:
    """Fetch a profile by user_id (public read)."""
    result = await db.execute(
        select(Profile)
        .where(Profile.user_id == user_id)
        .options(
            selectinload(Profile.experiences),
            selectinload(Profile.educations),
            selectinload(Profile.skills),
        )
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found.",
        )
    return _profile_to_response(profile)

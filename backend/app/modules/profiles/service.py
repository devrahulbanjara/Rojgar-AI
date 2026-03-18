from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructures.redis.service import redis_service

from app.modules.auth.models import User
from app.modules.profiles.models import (
    Profile,
    ProfileEducation,
    ProfileExperience,
    ProfileSkill,
)
from app.modules.profiles.schemas import (
    CandidateOnboardingRequest,
    ProfileResponse,
    ProfileUpdate,
)


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


def _profile_to_response(
    profile: Profile, avatar_url: str | None = None
) -> ProfileResponse:
    """Convert a Profile ORM instance to a response schema."""
    return ProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        avatar_url=avatar_url,
        headline=profile.headline,
        summary=profile.summary,
        phone=profile.phone,
        location=profile.location,
        linkedin_url=profile.linkedin_url,
        github_url=profile.github_url,
        portfolio_url=profile.portfolio_url,
        years_of_experience=profile.years_of_experience,
        target_roles=profile.target_roles or [],
        experiences=profile.experiences,
        educations=profile.educations,
        skills=profile.skills,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


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

    return _profile_to_response(profile, user.avatar_url)


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
    response = _profile_to_response(profile, user.avatar_url)

    # INVALIDATE CACHE
    await redis_service.delete(f"profile:detail:{user.id}")
    await redis_service.delete(f"dashboard:candidate:{user.id}")

    logger.info(f"Updated profile for user {user.id}")
    return response


async def get_profile_by_user_id(db: AsyncSession, user_id: str) -> ProfileResponse:
    cache_key = f"profile:detail:{user_id}"

    # 1. Try Cache
    cached_data = await redis_service.get(cache_key)
    if cached_data:
        return ProfileResponse.model_validate_json(cached_data)

    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found.",
        )

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

    response = _profile_to_response(profile, user.avatar_url)

    # 3. Save to Cache (TTL 1 hour)
    await redis_service.set(cache_key, response.model_dump_json(), ttl_seconds=3600)

    return response


async def complete_onboarding(
    db: AsyncSession, user: User, payload: CandidateOnboardingRequest
) -> ProfileResponse:
    """Set is_onboarded=True and persist the candidate's target roles."""
    if user.is_onboarded:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already onboarded.",
        )

    # 1. Mark user as onboarded
    user.is_onboarded = True

    # 2. Get or create profile
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

    # 3. Persist target roles
    profile.target_roles = payload.target_roles

    await db.commit()
    profile = await _load_full_profile(db, profile.id)
    response = _profile_to_response(profile, user.avatar_url)

    # INVALIDATE CACHE
    await redis_service.delete(f"profile:detail:{user.id}")
    await redis_service.delete(f"dashboard:candidate:{user.id}")

    logger.info(
        f"Candidate {user.id} completed onboarding with roles: {payload.target_roles}"
    )
    return response

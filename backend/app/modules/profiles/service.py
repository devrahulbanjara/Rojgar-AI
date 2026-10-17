from uuid import UUID

from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.cache import invalidate_profile_read_caches
from app.core.swr_cache import swr_get
from app.modules.applications.models import Application
from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import CompanyMembership
from app.modules.jobs.models import Job
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
    response = ProfileResponse.model_validate(profile)
    response.avatar_url = avatar_url
    return response


async def invalidate_profile_reads(user_id: str) -> None:
    """Invalidate cached profile reads for a user."""
    await invalidate_profile_read_caches(user_id)


async def _build_profile(db: AsyncSession, user: User) -> ProfileResponse:
    """Load the user's profile, creating an empty row on first read."""
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
            result = await db.execute(select(Profile).where(Profile.user_id == user.id))
            profile = result.scalar_one()
        profile = await _load_full_profile(db, profile.id)
        logger.info(f"Created empty profile for user {user.id}")

    return _profile_to_response(profile, user.avatar_url)


async def get_or_create_profile(db: AsyncSession, user: User) -> ProfileResponse:
    """Return the user's profile (SWR-cached), creating an empty one if missing."""
    cache_key = f"profile:detail:{user.id}"

    async def _load() -> dict:
        response = await _build_profile(db, user)
        return response.model_dump(mode="json")

    payload = await swr_get(cache_key, _load, soft_ttl=180, hard_ttl=900)
    return ProfileResponse.model_validate(payload)


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

    await invalidate_profile_read_caches(str(user.id))

    logger.info(f"Updated profile for user {user.id}")
    return response


async def _build_profile_by_user_id(db: AsyncSession, user_id: str) -> ProfileResponse:
    """Load a public profile response by user ID."""
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

    return _profile_to_response(profile, user.avatar_url)


async def get_profile_by_user_id(db: AsyncSession, user_id: str) -> ProfileResponse:
    """Fetch a public profile response by user ID (SWR-cached)."""
    cache_key = f"profile:detail:{user_id}"

    async def _load(db: AsyncSession = db) -> dict:
        response = await _build_profile_by_user_id(db, user_id)
        return response.model_dump(mode="json")

    payload = await swr_get(cache_key, _load, soft_ttl=600, hard_ttl=3600)
    return ProfileResponse.model_validate(payload)


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

    await invalidate_profile_read_caches(str(user.id))

    logger.info(
        f"Candidate {user.id} completed onboarding with roles: {payload.target_roles}"
    )
    return response


async def get_profile_for_viewer(
    db: AsyncSession, viewer: User, user_id: UUID
) -> ProfileResponse:
    """Profile by user ID, visible only to its owner or to recruiters whose
    company received an application from that candidate. Recruiters only see
    contact fields the candidate chose to share with their company."""
    not_found = HTTPException(
        status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found."
    )
    if viewer.id == user_id:
        return await get_profile_by_user_id(db, str(user_id))

    company_id = await db.scalar(
        select(CompanyMembership.company_id).where(
            CompanyMembership.user_id == viewer.id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    if company_id is None:
        raise not_found

    shared = (
        await db.execute(
            select(
                func.bool_or(Application.share_phone),
                func.bool_or(Application.share_location),
                func.bool_or(Application.share_links),
            )
            .join(Job, Job.id == Application.job_id)
            .where(Application.user_id == user_id, Job.company_id == company_id)
        )
    ).one()
    share_phone, share_location, share_links = shared
    if share_phone is None:  # no application to this company
        raise not_found

    profile = await get_profile_by_user_id(db, str(user_id))
    hidden: dict[str, None] = {}
    if not share_phone:
        hidden["phone"] = None
    if not share_location:
        hidden["location"] = None
    if not share_links:
        hidden.update(linkedin_url=None, github_url=None, portfolio_url=None)
    return profile.model_copy(update=hidden) if hidden else profile

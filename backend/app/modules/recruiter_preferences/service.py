from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User
from app.modules.recruiter_preferences.models import RecruiterPreference
from app.modules.recruiter_preferences.schemas import (
    RecruiterPreferenceResponse,
    UpdateRecruiterPreferenceRequest,
)


async def _get_or_create_preferences(db: AsyncSession, user_id) -> RecruiterPreference:
    result = await db.execute(
        select(RecruiterPreference).where(RecruiterPreference.user_id == user_id)
    )
    preference = result.scalar_one_or_none()
    if preference is not None:
        return preference

    preference = RecruiterPreference(user_id=user_id)
    db.add(preference)
    await db.flush()
    return preference


async def get_recruiter_preferences(
    db: AsyncSession,
    user: User,
) -> RecruiterPreferenceResponse:
    preference = await _get_or_create_preferences(db, user.id)
    await db.commit()
    await db.refresh(preference)
    return RecruiterPreferenceResponse.model_validate(preference)


async def update_recruiter_preferences(
    db: AsyncSession,
    user: User,
    payload: UpdateRecruiterPreferenceRequest,
) -> RecruiterPreferenceResponse:
    preference = await _get_or_create_preferences(db, user.id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(preference, key, value)

    await db.commit()
    await db.refresh(preference)
    return RecruiterPreferenceResponse.model_validate(preference)

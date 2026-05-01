from __future__ import annotations

from fastapi import APIRouter

from app.core.dependencies import ActiveMember, DbSession
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.recruiter_preferences import service
from app.modules.recruiter_preferences.schemas import (
    RecruiterPreferenceResponse,
    UpdateRecruiterPreferenceRequest,
)

router = APIRouter(prefix="/recruiter/preferences", tags=["Recruiter Preferences"])


@router.get("")
async def get_preferences(
    current_user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[RecruiterPreferenceResponse]:
    """Return recruiter preferences for the authenticated user."""
    data = await service.get_recruiter_preferences(db, current_user)
    return ResponseBuilder.success(data=data, message="Preferences retrieved.")


@router.patch("")
async def patch_preferences(
    payload: UpdateRecruiterPreferenceRequest,
    current_user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[RecruiterPreferenceResponse]:
    """Update recruiter preferences for the authenticated user."""
    data = await service.update_recruiter_preferences(db, current_user, payload)
    return ResponseBuilder.success(data=data, message="Preferences updated.")

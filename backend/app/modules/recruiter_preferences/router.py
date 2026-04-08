from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.auth.dependencies import require_active_membership
from app.modules.auth.models import User
from app.modules.recruiter_preferences import service
from app.modules.recruiter_preferences.schemas import (
    RecruiterPreferenceResponse,
    UpdateRecruiterPreferenceRequest,
)

router = APIRouter(prefix="/recruiter/preferences", tags=["Recruiter Preferences"])


@router.get("", response_model=UnifiedResponse[RecruiterPreferenceResponse])
async def get_preferences(
    current_user: User = Depends(require_active_membership),
    db: AsyncSession = Depends(get_db),
):
    data = await service.get_recruiter_preferences(db, current_user)
    return ResponseBuilder.success(data=data, message="Preferences retrieved.")


@router.patch("", response_model=UnifiedResponse[RecruiterPreferenceResponse])
async def patch_preferences(
    payload: UpdateRecruiterPreferenceRequest,
    current_user: User = Depends(require_active_membership),
    db: AsyncSession = Depends(get_db),
):
    data = await service.update_recruiter_preferences(db, current_user, payload)
    return ResponseBuilder.success(data=data, message="Preferences updated.")

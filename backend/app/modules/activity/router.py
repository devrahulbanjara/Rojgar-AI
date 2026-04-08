from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.activity import service
from app.modules.activity.schemas import ActivityEventResponse
from app.modules.auth.dependencies import get_current_user, require_active_membership
from app.modules.auth.models import User

router = APIRouter(prefix="/activity", tags=["Activity"])


@router.get("/me", response_model=UnifiedResponse[list[ActivityEventResponse]])
async def get_my_activity(
    limit: int = Query(default=25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await service.list_my_activity(db, current_user, limit=limit)
    return ResponseBuilder.success(data=data, message="Activity retrieved.")


@router.get("/company", response_model=UnifiedResponse[list[ActivityEventResponse]])
async def get_company_activity(
    limit: int = Query(default=40, ge=1, le=100),
    current_user: User = Depends(require_active_membership),
    db: AsyncSession = Depends(get_db),
):
    data = await service.list_company_activity(db, current_user, limit=limit)
    return ResponseBuilder.success(data=data, message="Company activity retrieved.")

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from app.core.dependencies import ActiveMember, CurrentUser, DbSession
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.activity import service
from app.modules.activity.schemas import ActivityEventResponse

router = APIRouter(prefix="/activity", tags=["Activity"])


@router.get("/me")
async def get_my_activity(
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    current_user: CurrentUser = None,
    db: DbSession = None,
) -> UnifiedResponse[list[ActivityEventResponse]]:
    """Return the authenticated user's recent activity feed."""
    data = await service.list_my_activity(db, current_user, limit=limit)
    return ResponseBuilder.success(data=data, message="Activity retrieved.")


@router.get("/company")
async def get_company_activity(
    limit: Annotated[int, Query(ge=1, le=100)] = 40,
    current_user: ActiveMember = None,
    db: DbSession = None,
) -> UnifiedResponse[list[ActivityEventResponse]]:
    """Return recent company activity for an active recruiter membership."""
    data = await service.list_company_activity(db, current_user, limit=limit)
    return ResponseBuilder.success(data=data, message="Company activity retrieved.")

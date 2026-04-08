from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.audit import service
from app.modules.audit.schemas import AuditLogResponse
from app.modules.auth.dependencies import (
    get_current_user,
    require_recruiter_admin,
)
from app.modules.auth.models import User

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("/me", response_model=UnifiedResponse[list[AuditLogResponse]])
async def get_my_audit_logs(
    limit: int = Query(default=50, ge=1, le=200),
    entity_type: str | None = Query(default=None),
    action_type: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await service.list_my_audit_logs(
        db,
        current_user,
        limit=limit,
        entity_type=entity_type,
        action_type=action_type,
    )
    return ResponseBuilder.success(data=data, message="Audit logs retrieved.")


@router.get("/company", response_model=UnifiedResponse[list[AuditLogResponse]])
async def get_company_audit_logs(
    limit: int = Query(default=100, ge=1, le=500),
    entity_type: str | None = Query(default=None),
    action_type: str | None = Query(default=None),
    actor_user_id: UUID | None = Query(default=None),
    target_user_id: UUID | None = Query(default=None),
    start_at: datetime | None = Query(default=None),
    end_at: datetime | None = Query(default=None),
    current_user: User = Depends(require_recruiter_admin),
    db: AsyncSession = Depends(get_db),
):
    data = await service.list_company_audit_logs(
        db,
        current_user,
        limit=limit,
        entity_type=entity_type,
        action_type=action_type,
        actor_user_id=actor_user_id,
        target_user_id=target_user_id,
        start_at=start_at,
        end_at=end_at,
    )
    return ResponseBuilder.success(data=data, message="Company audit logs retrieved.")


@router.get(
    "/entity/{entity_type}/{entity_id}",
    response_model=UnifiedResponse[list[AuditLogResponse]],
)
async def get_entity_audit_timeline(
    entity_type: str,
    entity_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await service.get_entity_audit_timeline(
        db,
        current_user,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    return ResponseBuilder.success(data=data, message="Entity audit trail retrieved.")

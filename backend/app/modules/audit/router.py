from __future__ import annotations

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query

from app.core.dependencies import CurrentUser, DbSession, RecruiterAdmin
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.audit import service
from app.modules.audit.schemas import AuditLogResponse

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("/company")
async def get_company_audit_logs(
    limit: Annotated[int, Query(ge=1, le=500)] = 200,
    category: Annotated[str | None, Query()] = None,
    actor_user_id: Annotated[UUID | None, Query()] = None,
    start_at: Annotated[datetime | None, Query()] = None,
    end_at: Annotated[datetime | None, Query()] = None,
    current_user: RecruiterAdmin = None,
    db: DbSession = None,
) -> UnifiedResponse[list[AuditLogResponse]]:
    """Return company audit logs for a recruiter admin."""
    data = await service.list_company_audit_logs(
        db,
        current_user,
        limit=limit,
        category=category,
        actor_user_id=actor_user_id,
        start_at=start_at,
        end_at=end_at,
    )
    return ResponseBuilder.success(data=data, message="Company audit logs retrieved.")


@router.get("/entity/{entity_type}/{entity_id}")
async def get_entity_audit_timeline(
    entity_type: str,
    entity_id: str,
    current_user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[list[AuditLogResponse]]:
    """Return the audit trail for a specific entity the user can access."""
    data = await service.get_entity_audit_timeline(
        db,
        current_user,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    return ResponseBuilder.success(data=data, message="Entity audit trail retrieved.")

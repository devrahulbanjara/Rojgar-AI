from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import and_, or_, select

from app.core.request_context import get_request_context
from app.modules.audit.models import AuditLog
from app.modules.audit.schemas import AuditLogResponse
from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import CompanyMembership


async def create_custom_audit_log(
    db,
    *,
    entity_type: str,
    action_type: str,
    category: str | None = None,
    message: str | None = None,
    entity_id: str | uuid.UUID | None = None,
    company_id: str | uuid.UUID | None = None,
    target_user_id: str | uuid.UUID | None = None,
    parent_entity_type: str | None = None,
    parent_entity_id: str | uuid.UUID | None = None,
    before_json: dict[str, Any] | None = None,
    after_json: dict[str, Any] | None = None,
    diff_json: dict[str, Any] | None = None,
    metadata: dict[str, Any] | None = None,
    reason: str | None = None,
    success: bool = True,
    error_message: str | None = None,
) -> AuditLog:
    """Write a single business-meaningful audit event."""
    context = get_request_context()
    audit_log = AuditLog(
        actor_user_id=context.actor_user_id,
        actor_role=context.actor_role,
        target_user_id=uuid.UUID(str(target_user_id)) if target_user_id else None,
        company_id=uuid.UUID(str(company_id)) if company_id else None,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        parent_entity_type=parent_entity_type,
        parent_entity_id=str(parent_entity_id)
        if parent_entity_id is not None
        else None,
        action_type=action_type,
        category=category,
        message=message,
        request_id=context.request_id,
        request_path=context.request_path,
        request_method=context.request_method,
        ip_address=context.ip_address,
        user_agent=context.user_agent,
        source=context.source,
        reason=reason,
        success=success,
        error_message=error_message,
        before_json=before_json,
        after_json=after_json,
        diff_json=diff_json,
        metadata_json=metadata,
    )
    db.add(audit_log)
    await db.flush()
    return audit_log


async def list_my_audit_logs(
    db,
    user: User,
    *,
    limit: int = 50,
    category: str | None = None,
) -> list[AuditLogResponse]:
    """List audit logs where the user is the actor or target."""
    stmt = select(AuditLog).where(
        or_(AuditLog.actor_user_id == user.id, AuditLog.target_user_id == user.id)
    )
    if category:
        stmt = stmt.where(AuditLog.category == category)
    stmt = stmt.order_by(AuditLog.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return [AuditLogResponse.model_validate(item) for item in result.scalars().all()]


async def _get_active_company_membership(db, user_id: uuid.UUID) -> CompanyMembership:
    """Return the active company membership for a user or raise 403."""
    result = await db.execute(
        select(CompanyMembership).where(
            CompanyMembership.user_id == user_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    membership = result.scalar_one_or_none()
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active company membership required.",
        )
    return membership


async def list_company_audit_logs(
    db,
    user: User,
    *,
    limit: int = 100,
    category: str | None = None,
    actor_user_id: uuid.UUID | None = None,
    start_at: datetime | None = None,
    end_at: datetime | None = None,
) -> list[AuditLogResponse]:
    """List company audit logs visible to an active recruiter admin."""
    membership = await _get_active_company_membership(db, user.id)
    filters = [AuditLog.company_id == membership.company_id]
    if category:
        filters.append(AuditLog.category == category)
    if actor_user_id:
        filters.append(AuditLog.actor_user_id == actor_user_id)
    if start_at:
        filters.append(AuditLog.created_at >= start_at)
    if end_at:
        filters.append(AuditLog.created_at <= end_at)

    result = await db.execute(
        select(AuditLog)
        .where(and_(*filters))
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )
    return [AuditLogResponse.model_validate(item) for item in result.scalars().all()]


async def get_entity_audit_timeline(
    db,
    user: User,
    *,
    entity_type: str,
    entity_id: str,
) -> list[AuditLogResponse]:
    """Return an entity's audit trail after enforcing access checks."""
    stmt = (
        select(AuditLog)
        .where(AuditLog.entity_type == entity_type, AuditLog.entity_id == entity_id)
        .order_by(AuditLog.created_at.asc())
    )
    result = await db.execute(stmt)
    items = result.scalars().all()
    if not items:
        return []

    membership = await db.scalar(
        select(CompanyMembership).where(
            CompanyMembership.user_id == user.id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    if membership is not None:
        company_rows = [i for i in items if i.company_id == membership.company_id]
        if company_rows:
            return [AuditLogResponse.model_validate(item) for item in company_rows]

    # A person sees only rows about themselves, with staff details removed.
    visible = [
        item
        for item in items
        if item.target_user_id == user.id or item.actor_user_id == user.id
    ]
    if not visible:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this audit trail.",
        )
    return [_candidate_safe(item, user.id) for item in visible]


# Fields describing who acted and how (recruiter identity, IP, device, request
# internals, raw before/after snapshots) are never exposed to candidates.
_CANDIDATE_HIDDEN_FIELDS = {
    "actor_role": None,
    "company_id": None,
    "request_id": None,
    "request_path": None,
    "request_method": None,
    "ip_address": None,
    "user_agent": None,
    "error_message": None,
    "before_json": None,
    "after_json": None,
    "diff_json": None,
    "metadata": None,
}


def _candidate_safe(item: AuditLog, viewer_id: uuid.UUID) -> AuditLogResponse:
    response = AuditLogResponse.model_validate(item)
    hidden = dict(_CANDIDATE_HIDDEN_FIELDS)
    if item.actor_user_id != viewer_id:
        hidden["actor_user_id"] = None
    return response.model_copy(update=hidden)

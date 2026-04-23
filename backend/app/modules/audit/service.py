from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any

from fastapi import HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy import and_, event, inspect, or_, select
from sqlalchemy.orm import Session

from app.core.request_context import get_request_context
from app.modules.audit.models import AuditLog
from app.modules.audit.schemas import AuditLogResponse
from app.modules.auth.enums import MembershipStatus, UserRole
from app.modules.auth.models import User
from app.modules.companies.models import CompanyMembership


REDACTED_VALUE = "[REDACTED]"
_AUDIT_COLLECTING_KEY = "audit_logs_collecting"
_AUDIT_DISABLED_KEY = "audit_logs_disabled"


@dataclass(slots=True)
class AuditScope:
    entity_type: str
    entity_id: str | None
    company_id: uuid.UUID | None = None
    target_user_id: uuid.UUID | None = None
    parent_entity_type: str | None = None
    parent_entity_id: str | None = None


REDACTED_FIELD_NAMES = {
    "password_hash",
    "password_reset_token",
    "email_verify_token",
    "jti",
}

EXCLUDED_ENTITY_TYPES = {
    "activity_event",
    "notification",
    "job_sync_event",
    "application_sync_event",
    "audit_log",
    "refresh_token",
    "oauth_account",
}

IGNORED_DIFF_FIELDS = {"updated_at"}


def _is_redacted_field(field_name: str) -> bool:
    """Return True when an audit field should be masked."""
    lowered = field_name.lower()
    return (
        field_name in REDACTED_FIELD_NAMES
        or "password" in lowered
        or lowered.endswith("_token")
    )


def _serialize_value(value: Any) -> Any:
    """Convert audit payload values into JSON-serializable forms."""
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(key): _serialize_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_serialize_value(item) for item in value]
    return jsonable_encoder(value)


def _should_skip_instance(instance: Any) -> bool:
    """Return True when an ORM instance should be excluded from auditing."""
    return _entity_type_for_instance(instance) in EXCLUDED_ENTITY_TYPES


def _entity_type_for_instance(instance: Any) -> str:
    """Map an ORM instance class to its audit entity type name."""
    name = instance.__class__.__name__
    mapping = {
        "Job": "job",
        "Application": "application",
        "Company": "company",
        "CompanyMembership": "membership",
        "Profile": "profile",
        "ProfileExperience": "profile_experience",
        "ProfileEducation": "profile_education",
        "ProfileSkill": "profile_skill",
        "Resume": "resume",
        "ResumeExperience": "resume_experience",
        "ResumeEducation": "resume_education",
        "ResumeSkill": "resume_skill",
        "ResumeImportTask": "resume_import_task",
        "EmailDraft": "email_draft",
        "Interview": "interview",
        "InterviewRecording": "interview_recording",
        "JobEvaluationSchema": "job_evaluation_schema",
        "CandidateEvaluationScore": "candidate_evaluation_score",
        "JobAIDraft": "job_ai_draft",
        "RecruiterPreference": "recruiter_preference",
        "RecruiterChatSession": "chat_session",
        "User": "user",
        "ActivityEvent": "activity_event",
        "Notification": "notification",
        "JobSyncEvent": "job_sync_event",
        "ApplicationSyncEvent": "application_sync_event",
        "AuditLog": "audit_log",
        "RefreshToken": "refresh_token",
        "OAuthAccount": "oauth_account",
    }
    return mapping.get(name, name.lower())


def _serialize_model(instance: Any) -> dict[str, Any]:
    """Serialize an ORM instance into an audit snapshot payload."""
    state = inspect(instance)
    data: dict[str, Any] = {}
    for column in state.mapper.columns:
        key = column.key
        if _is_redacted_field(key):
            data[key] = REDACTED_VALUE
            continue
        if (
            _entity_type_for_instance(instance) == "chat_session"
            and key == "state_json"
        ):
            data[key] = {
                "summary": "state stored",
                "keys": sorted((getattr(instance, key) or {}).keys()),
            }
            continue
        data[key] = _serialize_value(getattr(instance, key))
    return data


def _build_update_snapshots(
    instance: Any,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None, dict[str, Any] | None]:
    """Build before, after, and diff snapshots for an updated ORM instance."""
    state = inspect(instance)
    after_json = _serialize_model(instance)
    before_json = dict(after_json)
    diff_json: dict[str, dict[str, Any]] = {}

    for attr in state.mapper.column_attrs:
        key = attr.key
        if key in IGNORED_DIFF_FIELDS:
            continue
        history = state.attrs[key].history
        if not history.has_changes():
            continue

        before_value = (
            _serialize_value(history.deleted[-1]) if history.deleted else None
        )
        after_value = after_json.get(key)

        if _is_redacted_field(key):
            before_value = REDACTED_VALUE
            after_value = REDACTED_VALUE

        before_json[key] = before_value
        diff_json[key] = {
            "before": before_value,
            "after": after_value,
        }

    if not diff_json:
        return None, None, None
    return before_json, after_json, diff_json


def _resolve_related_instance(session: Session, model_cls, entity_id: uuid.UUID | None):
    """Resolve a related ORM instance from the identity map or database."""
    if entity_id is None:
        return None
    for instance in list(session.identity_map.values()) + list(session.new):
        if (
            isinstance(instance, model_cls)
            and getattr(instance, "id", None) == entity_id
        ):
            return instance
    return session.execute(
        select(model_cls).where(model_cls.id == entity_id)
    ).scalar_one_or_none()


def _resolve_job_company_id(
    session: Session, job_id: uuid.UUID | None
) -> uuid.UUID | None:
    """Resolve the company ID for a given job ID."""
    if job_id is None:
        return None
    from app.modules.jobs.models import Job

    job = _resolve_related_instance(session, Job, job_id)
    return getattr(job, "company_id", None) if job is not None else None


def _resolve_application(session: Session, application_id: uuid.UUID | None):
    """Resolve an application instance by ID."""
    if application_id is None:
        return None
    from app.modules.applications.models import Application

    return _resolve_related_instance(session, Application, application_id)


def _resolve_active_company_id_for_user(
    session: Session, user_id: uuid.UUID | None
) -> uuid.UUID | None:
    """Resolve the active company ID for a user within the current session."""
    if user_id is None:
        return None

    for instance in list(session.identity_map.values()) + list(session.new):
        if (
            isinstance(instance, CompanyMembership)
            and instance.user_id == user_id
            and instance.status == MembershipStatus.active
        ):
            return instance.company_id

    return session.execute(
        select(CompanyMembership.company_id).where(
            CompanyMembership.user_id == user_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    ).scalar_one_or_none()


def _resolve_scope(session: Session, instance: Any) -> AuditScope:
    """Derive audit scoping metadata for an ORM instance."""
    entity_type = _entity_type_for_instance(instance)
    entity_id = (
        str(getattr(instance, "id", None)) if getattr(instance, "id", None) else None
    )

    company_id = getattr(instance, "company_id", None)
    target_user_id = getattr(instance, "user_id", None)
    parent_entity_type: str | None = None
    parent_entity_id: str | None = None

    if entity_type == "company":
        company_id = getattr(instance, "id", None)
    elif entity_type == "job":
        target_user_id = getattr(instance, "posted_by", None)
    elif entity_type == "application":
        company_id = _resolve_job_company_id(session, getattr(instance, "job_id", None))
        parent_entity_type = "job"
        parent_entity_id = str(getattr(instance, "job_id", None))
    elif entity_type in {"email_draft", "interview", "interview_recording"}:
        application = _resolve_application(
            session, getattr(instance, "application_id", None)
        )
        parent_entity_type = "application"
        parent_entity_id = str(getattr(instance, "application_id", None))
        if application is not None:
            target_user_id = getattr(application, "user_id", None)
            company_id = _resolve_job_company_id(
                session, getattr(application, "job_id", None)
            )
    elif entity_type == "job_evaluation_schema":
        parent_entity_type = "job"
        parent_entity_id = str(getattr(instance, "job_id", None))
        company_id = _resolve_job_company_id(session, getattr(instance, "job_id", None))
    elif entity_type == "candidate_evaluation_score":
        parent_entity_type = "application"
        parent_entity_id = str(getattr(instance, "application_id", None))
        company_id = _resolve_job_company_id(session, getattr(instance, "job_id", None))
        application = _resolve_application(
            session, getattr(instance, "application_id", None)
        )
        if application is not None:
            target_user_id = getattr(application, "user_id", None)
    elif entity_type.startswith("resume_"):
        from app.modules.resumes.models import Resume

        resume = _resolve_related_instance(
            session, Resume, getattr(instance, "resume_id", None)
        )
        if resume is not None:
            target_user_id = getattr(resume, "user_id", None)
            parent_entity_type = "resume"
            parent_entity_id = str(resume.id)
    elif entity_type.startswith("profile_"):
        from app.modules.profiles.models import Profile

        profile = _resolve_related_instance(
            session, Profile, getattr(instance, "profile_id", None)
        )
        if profile is not None:
            target_user_id = getattr(profile, "user_id", None)
            parent_entity_type = "profile"
            parent_entity_id = str(profile.id)
    elif entity_type == "resume":
        target_user_id = getattr(instance, "user_id", None)
    elif entity_type == "profile":
        target_user_id = getattr(instance, "user_id", None)
    elif entity_type == "resume_import_task":
        target_user_id = getattr(instance, "user_id", None)
    elif entity_type == "membership":
        company_id = getattr(instance, "company_id", None)
        target_user_id = getattr(instance, "user_id", None)
        parent_entity_type = "company"
        parent_entity_id = str(getattr(instance, "company_id", None))
    elif entity_type == "job_ai_draft":
        company_id = getattr(instance, "company_id", None)
        target_user_id = getattr(instance, "recruiter_id", None)
    elif entity_type == "recruiter_preference":
        company_id = _resolve_active_company_id_for_user(
            session, getattr(instance, "user_id", None)
        )
        target_user_id = getattr(instance, "user_id", None)
    elif entity_type == "chat_session":
        company_id = getattr(instance, "company_id", None)
        target_user_id = getattr(instance, "recruiter_id", None)
    elif entity_type == "user":
        company_id = _resolve_active_company_id_for_user(
            session, getattr(instance, "id", None)
        )
        target_user_id = getattr(instance, "id", None)

    return AuditScope(
        entity_type=entity_type,
        entity_id=entity_id,
        company_id=company_id,
        target_user_id=target_user_id,
        parent_entity_type=parent_entity_type,
        parent_entity_id=parent_entity_id,
    )


def _infer_update_action(diff_json: dict[str, Any]) -> str:
    """Infer the audit action type from a field diff payload."""
    if any(key == "status" or key.endswith("_status") for key in diff_json):
        return "status_transition"
    if diff_json.get("is_approved", {}).get("after") is True:
        return "approve"
    if diff_json.get("is_sent", {}).get("after") is True:
        return "send"
    if diff_json.get("is_discarded", {}).get("after") is True:
        return "discard"
    if diff_json.get("hiring_completed", {}).get("after") is True:
        return "mark_complete"
    if diff_json.get("is_email_verified", {}).get("after") is True:
        return "verify"
    return "update"


def _build_audit_log(
    session: Session,
    *,
    instance: Any,
    action_type: str,
    before_json: dict[str, Any] | None,
    after_json: dict[str, Any] | None,
    diff_json: dict[str, Any] | None,
    reason: str | None = None,
    metadata: dict[str, Any] | None = None,
    success: bool = True,
    error_message: str | None = None,
) -> AuditLog | None:
    """Construct an audit-log row for an ORM lifecycle change."""
    scope = _resolve_scope(session, instance)
    if scope.entity_type in EXCLUDED_ENTITY_TYPES:
        return None

    context = get_request_context()
    return AuditLog(
        actor_user_id=context.actor_user_id,
        actor_role=context.actor_role,
        target_user_id=scope.target_user_id,
        company_id=scope.company_id,
        entity_type=scope.entity_type,
        entity_id=scope.entity_id,
        parent_entity_type=scope.parent_entity_type,
        parent_entity_id=scope.parent_entity_id,
        action_type=action_type,
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


@event.listens_for(Session, "before_flush")
def capture_audit_logs(session: Session, flush_context, instances) -> None:
    """Capture create, update, and delete audit logs before flush."""
    if session.info.get(_AUDIT_DISABLED_KEY):
        return
    if session.info.get(_AUDIT_COLLECTING_KEY):
        return

    session.info[_AUDIT_COLLECTING_KEY] = True
    try:
        for instance in list(session.new):
            if _should_skip_instance(instance):
                continue
            audit_log = _build_audit_log(
                session,
                instance=instance,
                action_type="create",
                before_json=None,
                after_json=_serialize_model(instance),
                diff_json=None,
            )
            if audit_log is not None:
                session.add(audit_log)

        for instance in list(session.dirty):
            if instance in session.deleted:
                continue
            if _should_skip_instance(instance):
                continue
            before_json, after_json, diff_json = _build_update_snapshots(instance)
            if diff_json is None:
                continue
            audit_log = _build_audit_log(
                session,
                instance=instance,
                action_type=_infer_update_action(diff_json),
                before_json=before_json,
                after_json=after_json,
                diff_json=diff_json,
            )
            if audit_log is not None:
                session.add(audit_log)

        for instance in list(session.deleted):
            if _should_skip_instance(instance):
                continue
            audit_log = _build_audit_log(
                session,
                instance=instance,
                action_type="delete",
                before_json=_serialize_model(instance),
                after_json=None,
                diff_json=None,
            )
            if audit_log is not None:
                session.add(audit_log)
    finally:
        session.info[_AUDIT_COLLECTING_KEY] = False


async def create_custom_audit_log(
    db,
    *,
    entity_type: str,
    action_type: str,
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
    """Create and flush an explicit audit-log record."""
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
    entity_type: str | None = None,
    action_type: str | None = None,
) -> list[AuditLogResponse]:
    """List audit logs where the user is the actor or target."""
    stmt = select(AuditLog).where(
        or_(AuditLog.actor_user_id == user.id, AuditLog.target_user_id == user.id)
    )
    if entity_type:
        stmt = stmt.where(AuditLog.entity_type == entity_type)
    if action_type:
        stmt = stmt.where(AuditLog.action_type == action_type)
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
    entity_type: str | None = None,
    action_type: str | None = None,
    actor_user_id: uuid.UUID | None = None,
    target_user_id: uuid.UUID | None = None,
    start_at: datetime | None = None,
    end_at: datetime | None = None,
) -> list[AuditLogResponse]:
    """List company audit logs visible to an active recruiter admin."""
    membership = await _get_active_company_membership(db, user.id)
    filters = [AuditLog.company_id == membership.company_id]
    if entity_type:
        filters.append(AuditLog.entity_type == entity_type)
    if action_type:
        filters.append(AuditLog.action_type == action_type)
    if actor_user_id:
        filters.append(AuditLog.actor_user_id == actor_user_id)
    if target_user_id:
        filters.append(AuditLog.target_user_id == target_user_id)
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

    if user.primary_role == UserRole.candidate:
        if not any(
            item.target_user_id == user.id or item.actor_user_id == user.id
            for item in items
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this audit trail.",
            )
    else:
        membership = await _get_active_company_membership(db, user.id)
        if not any(item.company_id == membership.company_id for item in items):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this audit trail.",
            )

    return [AuditLogResponse.model_validate(item) for item in items]

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.core.schemas import BaseSchema


class AuditLogResponse(BaseSchema):
    id: UUID
    actor_user_id: UUID | None = None
    actor_role: str | None = None
    target_user_id: UUID | None = None
    company_id: UUID | None = None
    entity_type: str
    entity_id: str | None = None
    parent_entity_type: str | None = None
    parent_entity_id: str | None = None
    action_type: str
    request_id: str | None = None
    request_path: str | None = None
    request_method: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    source: str
    reason: str | None = None
    success: bool
    error_message: str | None = None
    before_json: dict | None = None
    after_json: dict | None = None
    diff_json: dict | None = None
    metadata: dict | None = Field(default=None, validation_alias="metadata_json")
    category: str | None = None
    message: str | None = None
    created_at: datetime

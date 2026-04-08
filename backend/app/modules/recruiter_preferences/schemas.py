from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.core.schemas import BaseSchema


class RecruiterPreferenceResponse(BaseSchema):
    id: UUID
    user_id: UUID
    timezone: str | None = None
    notification_email_enabled: bool
    notification_in_app_enabled: bool
    default_interview_duration_minutes: int
    default_interview_buffer_minutes: int
    outreach_signature: str | None = None
    chat_default_scope: str
    created_at: datetime
    updated_at: datetime


class UpdateRecruiterPreferenceRequest(BaseSchema):
    timezone: str | None = Field(default=None, max_length=100)
    notification_email_enabled: bool | None = None
    notification_in_app_enabled: bool | None = None
    default_interview_duration_minutes: int | None = Field(default=None, ge=15, le=180)
    default_interview_buffer_minutes: int | None = Field(default=None, ge=0, le=60)
    outreach_signature: str | None = None
    chat_default_scope: str | None = Field(default=None, max_length=30)

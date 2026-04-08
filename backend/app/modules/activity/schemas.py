from __future__ import annotations

from datetime import datetime
from uuid import UUID

from app.core.schemas import BaseSchema


class ActivityEventResponse(BaseSchema):
    id: UUID
    user_id: UUID | None = None
    company_id: UUID | None = None
    application_id: UUID | None = None
    job_id: UUID | None = None
    interview_id: UUID | None = None
    draft_id: UUID | None = None
    actor_user_id: UUID | None = None
    event_type: str
    audience: str
    title: str
    description: str | None = None
    href: str | None = None
    metadata: dict | None = None
    created_at: datetime

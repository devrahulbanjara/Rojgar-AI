from __future__ import annotations

from datetime import datetime
from uuid import UUID

from app.core.schemas import BaseSchema


class NotificationResponse(BaseSchema):
    id: UUID
    user_id: UUID | None = None
    company_id: UUID | None = None
    activity_event_id: UUID | None = None
    kind: str
    title: str
    body: str | None = None
    href: str | None = None
    is_read: bool
    read_at: datetime | None = None
    created_at: datetime

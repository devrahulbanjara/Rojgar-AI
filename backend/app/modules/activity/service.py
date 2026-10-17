from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.activity.models import ActivityEvent
from app.modules.notifications.service import create_notification


async def create_activity_event(
    db: AsyncSession,
    *,
    event_type: str,
    audience: str,
    title: str,
    description: str | None = None,
    href: str | None = None,
    user_id: uuid.UUID | None = None,
    company_id: uuid.UUID | None = None,
    application_id: uuid.UUID | None = None,
    job_id: uuid.UUID | None = None,
    interview_id: uuid.UUID | None = None,
    actor_user_id: uuid.UUID | None = None,
    metadata: dict | None = None,
    create_in_app_notification: bool = True,
) -> ActivityEvent:
    """Create and flush an activity event, optionally also creating a notification."""
    event = ActivityEvent(
        event_type=event_type,
        audience=audience,
        title=title,
        description=description,
        href=href,
        user_id=user_id,
        company_id=company_id,
        application_id=application_id,
        job_id=job_id,
        interview_id=interview_id,
        actor_user_id=actor_user_id,
        metadata_json=metadata,
    )
    db.add(event)
    await db.flush()

    if create_in_app_notification:
        await create_notification(
            db,
            activity_event=event,
            kind=event_type,
            title=title,
            body=description or title,
            href=href,
            user_id=user_id,
            company_id=company_id,
        )

    return event

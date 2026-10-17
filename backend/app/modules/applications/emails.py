"""Decision emails: scheduled with the decision, sent after the undo window.

A decision writes an `email_scheduled` event (payload status "scheduled").
After `UNDO_SECONDS` the sender claims it ("sending"), sends it with no
database transaction open, and turns it into an `email_sent` event. Undo
deletes the event while it is still "scheduled"; once claimed it can't be
undone. Overdue scheduled emails are picked up again at startup.
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import UTC, datetime, timedelta

from loguru import logger
from sqlalchemy import cast, delete, select, update
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.modules.applications.models import Application, ApplicationEvent
from app.modules.companies.models import Company
from app.modules.jobs.models import Job
from app.modules.applications.email_templates import render
from app.modules.public.tokens import create_status_token, status_url
from app.shared.enums import EventType

UNDO_SECONDS = 10


def _now() -> datetime:
    return datetime.now(UTC)


def candidate_email(application: Application) -> str | None:
    """Where decision emails go: the address they applied with."""
    return application.shared_email_value or (
        application.user.email if application.user else None
    )


def schedule_email(
    db: AsyncSession,
    *,
    application: Application,
    job: Job,
    company: Company | None,
    template: str,
    actor_user_id: uuid.UUID | None,
    decision_event_id: uuid.UUID | None,
    booking_url: str | None = None,
) -> ApplicationEvent | None:
    """Add an `email_scheduled` event (caller commits). None if no address.

    ``booking_url`` is the interview scheduling link (interview invites).
    """
    to = candidate_email(application)
    if not to:
        return None
    content = render(
        template,
        candidate_name=application.shared_full_name
        or (application.user.full_name if application.user else None),
        job_title=job.title,
        company_name=company.name if company else "The hiring team",
        status_link=status_url(create_status_token(application.id)),
        booking_url=booking_url,
    )
    event = ApplicationEvent(
        id=uuid.uuid4(),
        application_id=application.id,
        type=EventType.email_scheduled.value,
        actor_user_id=actor_user_id,
        payload={
            "status": "scheduled",
            "template": content.template,
            "to": to,
            "subject": content.subject,
            "html": content.html,
            "send_at": (_now() + timedelta(seconds=UNDO_SECONDS)).isoformat(),
            "decision_event_id": str(decision_event_id) if decision_event_id else None,
        },
    )
    db.add(event)
    return event


async def cancel_scheduled(db: AsyncSession, event_id: uuid.UUID) -> bool:
    """Delete a scheduled email if it has not been claimed. Caller commits."""
    result = await db.execute(
        delete(ApplicationEvent)
        .where(
            ApplicationEvent.id == event_id,
            ApplicationEvent.type == EventType.email_scheduled.value,
            ApplicationEvent.payload["status"].astext == "scheduled",
        )
        .returning(ApplicationEvent.id)
        .execution_options(synchronize_session=False)
    )
    return result.scalar_one_or_none() is not None


async def _claim(db: AsyncSession, event_id: uuid.UUID) -> dict | None:
    result = await db.execute(
        update(ApplicationEvent)
        .where(
            ApplicationEvent.id == event_id,
            ApplicationEvent.type == EventType.email_scheduled.value,
            ApplicationEvent.payload["status"].astext == "scheduled",
        )
        .values(
            payload=ApplicationEvent.payload.op("||")(
                cast({"status": "sending"}, JSONB)
            )
        )
        .returning(ApplicationEvent.payload, ApplicationEvent.application_id)
        .execution_options(synchronize_session=False)
    )
    row = result.one_or_none()
    await db.commit()
    if row is None:
        return None
    return {**row[0], "application_id": row[1]}


async def deliver(event_id: uuid.UUID, *, db: AsyncSession | None = None) -> bool:
    """Send one scheduled email now. True if this call sent it."""
    from app.infrastructures.email.service import EmailService

    if db is None:
        async with AsyncSessionLocal() as session:
            return await deliver(event_id, db=session)

    payload = await _claim(db, event_id)
    if payload is None:
        return False
    try:
        await EmailService.send_generic_email_or_raise(
            payload["to"], payload["subject"], payload["html"]
        )
    except Exception as exc:  # noqa: BLE001 - recorded on the event
        logger.warning("Decision email {} failed: {}", event_id, type(exc).__name__)
        await db.execute(
            update(ApplicationEvent)
            .where(ApplicationEvent.id == event_id)
            .values(
                payload=ApplicationEvent.payload.op("||")(
                    cast({"status": "failed"}, JSONB)
                )
            )
            .execution_options(synchronize_session=False)
        )
        await db.commit()
        return False
    await db.execute(
        update(ApplicationEvent)
        .where(ApplicationEvent.id == event_id)
        .values(
            type=EventType.email_sent.value,
            payload=ApplicationEvent.payload.op("||")(
                cast({"status": "sent", "sent_at": _now().isoformat()}, JSONB)
            ),
        )
        .execution_options(synchronize_session=False)
    )
    await _notify_candidate(db, payload)
    await db.commit()
    return True


async def _notify_candidate(db: AsyncSession, payload: dict) -> None:
    """In-app notification for signed-in candidates, once the email is out."""
    from app.modules.activity.service import create_activity_event

    row = await db.execute(
        select(Application.user_id, Job.id, Job.company_id, Job.title)
        .join(Job, Job.id == Application.job_id)
        .where(Application.id == payload["application_id"])
    )
    found = row.one_or_none()
    if found is None:
        return
    user_id, job_id, company_id, title = found
    await create_activity_event(
        db,
        event_type=f"application_{payload.get('template')}",
        audience="candidate",
        title=payload.get("subject") or f"Update on {title}",
        href=f"/candidate/applications/{payload['application_id']}",
        user_id=user_id,
        company_id=company_id,
        application_id=payload["application_id"],
        job_id=job_id,
    )


async def send_after_undo_window(event_ids: list[uuid.UUID]) -> None:
    """Background task: wait out the undo window, then send what is left."""
    await asyncio.sleep(UNDO_SECONDS)
    for event_id in event_ids:
        try:
            await deliver(event_id)
        except Exception:  # noqa: BLE001 - one bad email never blocks the rest
            logger.exception("Decision email {} failed to send", event_id)


async def deliver_overdue(limit: int = 200) -> int:
    """Startup/periodic sweep: send scheduled emails whose window has passed."""
    async with AsyncSessionLocal() as db:
        ids = list(
            await db.scalars(
                select(ApplicationEvent.id)
                .where(
                    ApplicationEvent.type == EventType.email_scheduled.value,
                    ApplicationEvent.payload["status"].astext == "scheduled",
                    ApplicationEvent.created_at
                    < _now() - timedelta(seconds=UNDO_SECONDS),
                )
                .order_by(ApplicationEvent.created_at.asc())
                .limit(limit)
            )
        )
    sent = 0
    for event_id in ids:
        sent += int(await deliver(event_id))
    return sent

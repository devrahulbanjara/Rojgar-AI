"""Reminder emails/SMS 24 hours and 1 hour before each interview.

Every API worker runs ``reminder_loop``; a Postgres advisory lock lets only
one of them sweep at a time, and each reminder is claimed with an atomic
UPDATE ... RETURNING before it is sent, so nobody gets the same reminder twice.
"""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta

from loguru import logger
from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.modules.applications.models import Application
from app.modules.companies.models import Company
from app.modules.interviews import notify
from app.modules.interviews.models import Interview, InterviewInvite, InterviewStatus
from app.modules.interviews.service import build_message
from app.modules.jobs.models import Job

SWEEP_SECONDS = 300
_LOCK_KEY = 0x524A_5245_4D49  # "RJREMI": any constant shared by all workers

# (column, lead time). The 1-hour pass runs first and also marks the
# 24-hour reminder, so nobody gets both at once.
_HOUR = timedelta(hours=1)
_DAY = timedelta(hours=24)
_REMINDERS = (
    (Interview.reminder_1h_sent_at, _HOUR),
    (Interview.reminder_24h_sent_at, _DAY),
)


async def send_due_reminders(db: AsyncSession, now: datetime | None = None) -> int:
    """Send every due reminder once. Returns how many were sent.

    Claims run in one short transaction under the advisory lock; the emails
    and SMS go out after the commit, without holding a connection.
    """
    now = now or datetime.now(UTC)
    locked = await db.scalar(
        text("SELECT pg_try_advisory_xact_lock(:key)"), {"key": _LOCK_KEY}
    )
    if not locked:
        await db.rollback()
        return 0
    due: list[notify.InterviewMessage] = []
    for column, lead in _REMINDERS:
        filters = [
            Interview.status == InterviewStatus.booked,
            column.is_(None),
            Interview.start_time > now,
            Interview.start_time <= now + lead,
        ]
        if lead == _DAY:
            # Just booked or moved: the confirmation was the reminder.
            filters.append(Interview.updated_at <= now - _HOUR)
        claimed = await db.scalars(
            update(Interview)
            .where(*filters)
            .values({column.key: now})
            .returning(Interview.id)
        )
        ids = list(claimed)
        if lead == _HOUR and ids:
            # The 1-hour reminder makes a late 24-hour one pointless.
            await db.execute(
                update(Interview)
                .where(Interview.id.in_(ids), Interview.reminder_24h_sent_at.is_(None))
                .values(reminder_24h_sent_at=now)
            )
        due += [await _message(db, interview_id) for interview_id in ids]
    await db.commit()

    sent = 0
    for message in due:
        try:
            await notify.send_reminder(message)
            sent += 1
        except Exception:
            logger.exception("Interview reminder failed")
    return sent


async def _message(db: AsyncSession, interview_id) -> notify.InterviewMessage:
    interview, application, job, company, invite = (
        await db.execute(
            select(Interview, Application, Job, Company, InterviewInvite)
            .join(Application, Application.id == Interview.application_id)
            .join(Job, Job.id == Application.job_id)
            .join(Company, Company.id == Job.company_id)
            .join(
                InterviewInvite,
                InterviewInvite.application_id == Interview.application_id,
            )
            .where(Interview.id == interview_id)
        )
    ).one()
    return await build_message(db, application, job, company, invite, interview)


async def reminder_loop() -> None:
    """Background task started in the app lifespan."""
    while True:
        try:
            async with AsyncSessionLocal() as db:
                await send_due_reminders(db)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Interview reminder sweep failed")
        await asyncio.sleep(SWEEP_SECONDS)

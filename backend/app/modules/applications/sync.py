import uuid

from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.infrastructures.qdrant import outbox
from app.infrastructures.qdrant.service import qdrant_service
from app.modules.applications.models import (
    Application,
    ApplicationSyncEvent,
    Review,
)
from app.modules.jobs.models import Job
from app.modules.resumes.models import Resume
from app.shared.enums import SyncAction, SyncStatus


def enqueue_application_sync_event(
    db,
    application_id: uuid.UUID,
    action: SyncAction = SyncAction.UPSERT,
) -> ApplicationSyncEvent:
    """Create and add one application outbox event to the current session."""
    event = ApplicationSyncEvent(application_id=application_id, action=action)
    db.add(event)
    return event


def enqueue_application_sync_events(
    db,
    application_ids: list[uuid.UUID],
    action: SyncAction = SyncAction.UPSERT,
) -> list[ApplicationSyncEvent]:
    """Create and add multiple application outbox events to the session."""
    return [
        enqueue_application_sync_event(db, application_id, action)
        for application_id in application_ids
    ]


async def process_sync_event(event_id: uuid.UUID, *, log: bool = True) -> str | None:
    """Apply one application outbox event (upsert or delete in Qdrant).

    Never raises. On failure the event is retried later with backoff (see
    `outbox`) and the short reason is returned; ``log`` writes one warning.
    """
    async with AsyncSessionLocal() as db:
        event = await db.scalar(
            select(ApplicationSyncEvent).where(ApplicationSyncEvent.id == event_id)
        )
        if not event or event.status == SyncStatus.COMPLETED:
            return None
        application_id = event.application_id
        row = None
        review = None
        if event.action == SyncAction.UPSERT:
            row = (
                await db.execute(
                    select(Application, Job)
                    .join(Job, Job.id == Application.job_id)
                    .where(Application.id == application_id)
                    .options(
                        selectinload(Application.resume).selectinload(
                            Resume.experiences
                        ),
                        selectinload(Application.resume).selectinload(
                            Resume.educations
                        ),
                        selectinload(Application.resume).selectinload(Resume.skills),
                    )
                )
            ).one_or_none()
            if row is not None:
                review = await db.scalar(
                    select(Review).where(Review.application_id == application_id)
                )
        # No transaction stays open while the model and Qdrant work.
        await db.commit()

        try:
            if row is None:
                await qdrant_service.delete_application(application_id)
            else:
                application, job = row
                await qdrant_service.upsert_application(application, job, review)
        except Exception as exc:
            attempts, parked = outbox.record_failure(event, exc)
            if log:
                logger.warning(
                    "Application {} search index update {} (attempt {}): {}",
                    application_id,
                    "gave up" if parked else "failed, will retry",
                    attempts,
                    event.error_message,
                )
            await db.commit()
            return event.error_message
        event.status = SyncStatus.COMPLETED
        event.error_message = None
        await db.commit()
        return None


async def process_pending_events() -> None:
    """Retry due PENDING/FAILED application events oldest-first."""
    async with AsyncSessionLocal() as db:
        events = (
            await db.scalars(
                select(ApplicationSyncEvent)
                .where(outbox.retryable(ApplicationSyncEvent))
                .order_by(ApplicationSyncEvent.updated_at.asc())
                .limit(outbox.SWEEP_SCAN)
            )
        ).all()
        event_ids = [e.id for e in events if outbox.is_due(e)][: outbox.SWEEP_BATCH]

    if not event_ids:
        return
    errors = [await process_sync_event(i, log=False) for i in event_ids]
    failed = [e for e in errors if e]
    if failed:
        logger.warning(
            "Applicant search index: {} of {} update(s) failed, retrying later: {}",
            len(failed),
            len(event_ids),
            failed[0],
        )

import uuid

from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.infrastructures.qdrant import outbox
from app.infrastructures.qdrant.service import qdrant_service
from app.modules.jobs.models import Job, JobSyncEvent
from app.shared.enums import SyncAction, SyncStatus


async def process_sync_event(event_id: uuid.UUID, *, log: bool = True) -> str | None:
    """Apply one outbox event (upsert or delete in Qdrant).

    Never raises. On failure the event is retried later with backoff (see
    `outbox`) and the short reason is returned; ``log`` writes one warning.
    """
    async with AsyncSessionLocal() as db:
        event = await db.scalar(select(JobSyncEvent).where(JobSyncEvent.id == event_id))
        if not event or event.status == SyncStatus.COMPLETED:
            return None
        job_id = event.job_id
        action = event.action
        job = None
        if action == SyncAction.UPSERT:
            job = await db.scalar(
                select(Job).options(selectinload(Job.company)).where(Job.id == job_id)
            )
        # No transaction stays open while the model and Qdrant work.
        await db.commit()

        try:
            # Only open jobs before their closing time belong in the vector
            # store; drafts and closed jobs are removed from Qdrant.
            if job is not None and qdrant_service._job_is_searchable(job):
                await qdrant_service.upsert_job(job)
            else:
                await qdrant_service.delete_job(job_id)
        except Exception as exc:
            attempts, parked = outbox.record_failure(event, exc)
            if log:
                logger.warning(
                    "Job {} search index update {} (attempt {}): {}",
                    job_id,
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
    """Retry due PENDING/FAILED events oldest-first (background daemon)."""
    async with AsyncSessionLocal() as db:
        events = (
            await db.scalars(
                select(JobSyncEvent)
                .where(outbox.retryable(JobSyncEvent))
                .order_by(JobSyncEvent.updated_at.asc())
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
            "Job search index: {} of {} update(s) failed, retrying later: {}",
            len(failed),
            len(event_ids),
            failed[0],
        )

import uuid
from datetime import datetime, timezone

from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.modules.jobs.models import Job, JobSyncEvent
from app.infrastructures.qdrant.service import qdrant_service
from app.shared.enums import JobStatus, SyncAction, SyncStatus


async def process_sync_event(event_id: uuid.UUID) -> None:
    """Processes a single outbox event: upserts or deletes from Qdrant."""
    async with AsyncSessionLocal() as db:
        event = await db.scalar(select(JobSyncEvent).where(JobSyncEvent.id == event_id))
        if not event or event.status == SyncStatus.COMPLETED:
            return

        try:
            if event.action == SyncAction.UPSERT:
                job = await db.scalar(
                    select(Job)
                    .options(selectinload(Job.company))
                    .where(Job.id == event.job_id)
                )

                now = datetime.now(timezone.utc)

                # Only open jobs before their closing time belong in the vector
                # store; drafts and closed jobs are removed from Qdrant.
                if (
                    job
                    and job.status == JobStatus.open
                    and (job.closes_at is None or job.closes_at > now)
                ):
                    await qdrant_service.upsert_job(job)
                else:
                    await qdrant_service.delete_job(event.job_id)

            elif event.action == SyncAction.DELETE:
                await qdrant_service.delete_job(event.job_id)

            # Mark success
            event.status = SyncStatus.COMPLETED
            event.error_message = None

        except Exception as e:
            # Mark failure — will be retried by the safety-net daemon
            event.status = SyncStatus.FAILED
            event.error_message = str(e)
            logger.error(
                f"Failed to process sync event {event_id} for job {event.job_id}: {e}"
            )
        finally:
            await db.commit()


async def process_pending_events() -> None:
    """Sweeps the DB for PENDING or FAILED events (called by the background daemon)."""
    async with AsyncSessionLocal() as db:
        events = await db.scalars(
            select(JobSyncEvent)
            .where(JobSyncEvent.status.in_([SyncStatus.PENDING, SyncStatus.FAILED]))
            .order_by(JobSyncEvent.created_at.asc())
            .limit(50)  # Process at most 50 events per sweep
        )
        event_ids = [e.id for e in events]

    if not event_ids:
        return

    logger.info(
        f"Sync daemon: found {len(event_ids)} pending/failed Qdrant event(s). Processing…"
    )
    for event_id in event_ids:
        await process_sync_event(event_id)

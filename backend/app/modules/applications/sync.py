import uuid

from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.infrastructures.qdrant.service import qdrant_service
from app.modules.applications.models import Application, ApplicationSyncEvent
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


async def process_sync_event(event_id: uuid.UUID) -> None:
    """Process one application sync event in a fresh database session."""
    async with AsyncSessionLocal() as db:
        event = await db.scalar(
            select(ApplicationSyncEvent).where(ApplicationSyncEvent.id == event_id)
        )
        if not event or event.status == SyncStatus.COMPLETED:
            return

        try:
            if event.action == SyncAction.UPSERT:
                result = await db.execute(
                    select(Application, Job)
                    .join(Job, Job.id == Application.job_id)
                    .where(Application.id == event.application_id)
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
                row = result.one_or_none()
                if row is None:
                    await qdrant_service.delete_application(event.application_id)
                else:
                    application, job = row
                    await qdrant_service.upsert_application(application, job)
            elif event.action == SyncAction.DELETE:
                await qdrant_service.delete_application(event.application_id)

            event.status = SyncStatus.COMPLETED
            event.error_message = None
        except Exception as exc:
            event.status = SyncStatus.FAILED
            event.error_message = str(exc)
            logger.error(
                "Failed to process application sync event {} for application {}: {}",
                event_id,
                event.application_id,
                exc,
            )
        finally:
            await db.commit()


async def process_pending_events() -> None:
    """Process up to 50 pending or failed application sync events oldest-first."""
    async with AsyncSessionLocal() as db:
        events = await db.scalars(
            select(ApplicationSyncEvent)
            .where(
                ApplicationSyncEvent.status.in_([SyncStatus.PENDING, SyncStatus.FAILED])
            )
            .order_by(ApplicationSyncEvent.created_at.asc())
            .limit(50)
        )
        event_ids = [event.id for event in events]

    if not event_ids:
        return

    logger.info(
        "Application sync daemon: found {} pending/failed Qdrant event(s). Processing...",
        len(event_ids),
    )
    for event_id in event_ids:
        await process_sync_event(event_id)

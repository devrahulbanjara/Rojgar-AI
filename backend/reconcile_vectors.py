"""
One-time backfill script: ensures every job in Postgres has a corresponding
entry in the job_sync_events outbox so the background daemon picks it up.

Safe to run multiple times — it skips jobs that already have any sync event.

Usage:
    uv run python reconcile_vectors.py
"""

import asyncio

from loguru import logger
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.modules.jobs.enums import SyncAction, SyncStatus
from app.modules.jobs.models import Job, JobSyncEvent
from app.integrations.qdrant.service import qdrant_service


async def reconcile() -> None:
    await qdrant_service.initialize()  # Ensure collection + indexes exist

    async with AsyncSessionLocal() as db:
        # Fetch every job regardless of status so we can make a conscious
        # decision about each one.
        jobs = (await db.scalars(select(Job))).all()
        logger.info(f"Found {len(jobs)} job(s) in Postgres. Checking outbox…")

        created_count = 0
        skipped_count = 0

        for job in jobs:
            # Skip if any sync event already exists (including COMPLETED ones)
            existing = await db.scalar(
                select(JobSyncEvent).where(JobSyncEvent.job_id == job.id)
            )
            if existing:
                skipped_count += 1
                continue

            # Create a PENDING UPSERT event — the daemon (or the fast-path
            # after restart) will call process_sync_event which will check
            # job.status and remove non-active jobs from Qdrant automatically.
            db.add(
                JobSyncEvent(
                    job_id=job.id,
                    action=SyncAction.UPSERT,
                    status=SyncStatus.PENDING,
                )
            )
            created_count += 1
            logger.debug(f"  Queued job '{job.title}' ({job.id})")

        await db.commit()

    logger.success(
        f"Reconciliation complete — "
        f"{created_count} event(s) created, {skipped_count} already had events."
    )
    if created_count:
        logger.info(
            "The background daemon will process them within 60 s. "
            "You can also restart the API to trigger the fast-path immediately."
        )


if __name__ == "__main__":
    asyncio.run(reconcile())

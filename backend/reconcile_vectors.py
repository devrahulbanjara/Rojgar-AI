"""
Backfill script: ensures every job in Postgres gets a PENDING sync event
so the background daemon re-embeds and re-upserts it to Qdrant.

Modes:
    --force    Queue ALL jobs (re-sync everything, e.g. after schema/payload change)
    (default)  Only queue jobs that have zero sync events

Safe to run multiple times in either mode.

Usage:
    uv run python reconcile_vectors.py          # incremental
    uv run python reconcile_vectors.py --force  # full re-sync
"""

import asyncio
import sys

from loguru import logger
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.infrastructures.qdrant.service import qdrant_service
from app.modules.jobs.models import Job, JobSyncEvent
from app.shared.enums import SyncAction, SyncStatus


async def reconcile(*, force: bool = False) -> None:
    await qdrant_service.initialize()  # Ensure collection + indexes exist

    async with AsyncSessionLocal() as db:
        jobs = (await db.scalars(select(Job))).all()
        logger.info(f"Found {len(jobs)} job(s) in Postgres. Mode: {'force' if force else 'incremental'}")

        created_count = 0
        skipped_count = 0

        for job in jobs:
            if not force:
                existing = await db.scalar(
                    select(JobSyncEvent).where(JobSyncEvent.job_id == job.id)
                )
                if existing:
                    skipped_count += 1
                    continue

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
        f"{created_count} event(s) created, {skipped_count} skipped."
    )
    if created_count:
        logger.info(
            "The background daemon will process them within 60 s. "
            "You can also restart the API to trigger the fast-path immediately."
        )


if __name__ == "__main__":
    force_flag = "--force" in sys.argv
    asyncio.run(reconcile(force=force_flag))

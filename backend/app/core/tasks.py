import asyncio

from loguru import logger

from app.infrastructures.ai.service import short_error
from app.modules.applications.sync import (
    process_pending_events as process_pending_application_events,
)
from app.modules.jobs.sync import process_pending_events


async def sync_daemon_loop() -> None:
    """Runs forever in the background to guarantee eventual consistency.

    Every 60 seconds it sweeps the job and application outbox for PENDING
    events and FAILED ones whose backoff has passed (see
    ``infrastructures/qdrant/outbox``). A safety net on top of the per-request
    fast path, so a Qdrant or model hiccup never loses an update.
    """
    logger.info("Qdrant Sync Daemon started — safety net running every 60 s.")
    while True:
        try:
            await asyncio.sleep(60)
            await process_pending_events()
            await process_pending_application_events()
        except asyncio.CancelledError:
            logger.info("Qdrant Sync Daemon shutting down gracefully.")
            break
        except Exception as exc:
            # Log but don't crash: the loop must keep running.
            logger.warning("Qdrant sync sweep failed: {}", short_error(exc))

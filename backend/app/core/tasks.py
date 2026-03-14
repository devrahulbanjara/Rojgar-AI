import asyncio

from loguru import logger

from app.modules.jobs.sync import process_pending_events


async def sync_daemon_loop() -> None:
    """Runs forever in the background to guarantee eventual consistency.

    Every 60 seconds it sweeps ``job_sync_events`` for any PENDING or FAILED
    records and retries them.  This acts as a safety net on top of the
    per-request BackgroundTask fast path, ensuring no job is ever permanently
    lost from Qdrant due to transient network/API failures.
    """
    logger.info("Qdrant Sync Daemon started — safety net running every 60 s.")
    while True:
        try:
            await asyncio.sleep(60)
            await process_pending_events()
        except asyncio.CancelledError:
            logger.info("Qdrant Sync Daemon shutting down gracefully.")
            break
        except Exception as e:
            # Log but don't crash — the loop must keep running
            logger.error(f"Qdrant Sync Daemon error: {e}")

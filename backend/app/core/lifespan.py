import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.logging_config import logger
from app.db.session import AsyncSessionLocal, engine, init_db
from app.integrations.qdrant.vector_service import JobVectorService
from app.worker.scheduler import shutdown_scheduler, start_scheduler


async def _run_startup_tasks():
    logger.info("Initializing database schema...")
    await init_db()
    try:
        logger.trace("Indexing pending active jobs...")
        async with AsyncSessionLocal() as db:
            vector_service = JobVectorService()
            await vector_service.index_all_pending_jobs(db)
        logger.success("System Ready!")
    except Exception as e:
        logger.error(f"Startup indexing error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ConvexHire API...")
    await _run_startup_tasks()
    start_scheduler()
    try:
        yield
    except asyncio.CancelledError:
        pass
    finally:
        logger.trace("Shutting down ConvexHire API...")
        try:
            shutdown_scheduler()
        except Exception as e:
            logger.debug(
                f"Error shutting down scheduler (may be expected during reload): {e}"
            )
        try:
            await engine.dispose()
        except (Exception, asyncio.CancelledError) as e:
            logger.debug(f"Error disposing engine (may be expected during reload): {e}")

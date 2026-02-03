import asyncio
import time
from contextlib import asynccontextmanager

import anyio
from alembic.config import Config
from alembic import command
from fastapi import FastAPI
from sqlalchemy.exc import OperationalError

from app.core.logging_config import logger
from app.db.session import AsyncSessionLocal, engine
from app.integrations.qdrant.vector_service import JobVectorService
from app.worker.scheduler import shutdown_scheduler, start_scheduler


def run_alembic_upgrade():
    logger.info("Applying database migrations...")
    alembic_cfg = Config("alembic.ini")
    
    max_retries = 5
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            command.upgrade(alembic_cfg, "head")
            return
        except OperationalError as e:
            if attempt < max_retries - 1:
                logger.warning(
                    f"Database not ready (attempt {attempt + 1}/{max_retries}): {e}. "
                    f"Retrying in {retry_delay}s..."
                )
                time.sleep(retry_delay)
            else:
                logger.error(f"Failed to connect to database after {max_retries} attempts")
                raise
        except Exception as e:
            logger.error(f"Migration error: {e}")
            raise


async def _run_startup_tasks():
    try:
        await anyio.to_thread.run_sync(run_alembic_upgrade)
        logger.success("Database migrations applied successfully.")
    except Exception as e:
        logger.error(f"Migration error: {e}")
        raise
    
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

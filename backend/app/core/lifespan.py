from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy.orm import Session

from app.core.database import engine, init_db
from app.core.logging_config import logger
from app.services.candidate.vector_job_service import JobVectorService


async def _run_startup_tasks():
    """Internal helper for startup logic."""
    logger.trace("Initializing database schema...")
    init_db()

    try:
        logger.trace("Indexing pending active jobs...")
        with Session(engine) as db:
            vector_service = JobVectorService()
            vector_service.index_all_pending_jobs(db)
        logger.success("System Ready!")
    except Exception as e:
        logger.error(f"Startup indexing error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP
    logger.info("Starting ConvexHire API...")
    await _run_startup_tasks()

    yield

    # SHUTDOWN
    logger.trace("Shutting down ConvexHire API...")
    engine.dispose()  # Cleanly close connection pool

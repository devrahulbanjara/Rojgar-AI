from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy.orm import Session

from app.core.database import engine, init_db
from app.core.logging_config import logger
from app.core.scheduler import shutdown_scheduler, start_scheduler
from app.services.candidate.vector_job_service import JobVectorService


async def _run_startup_tasks():
    logger.info("Initializing database schema...")
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
    logger.info("Starting ConvexHire API...")
    await _run_startup_tasks()
    start_scheduler()
    yield
    logger.trace("Shutting down ConvexHire API...")
    shutdown_scheduler()
    engine.dispose()

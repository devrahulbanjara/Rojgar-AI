import asyncio

from apscheduler.schedulers.background import BackgroundScheduler
from loguru import logger
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.modules.jobs.service import expire_due_jobs


async def _expire_due_jobs_once() -> int:
    async with AsyncSessionLocal() as session:
        return await expire_due_jobs(session)


async def _expire_due_jobs_once_in_scheduler_thread() -> int:
    engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
        pool_pre_ping=True,
    )
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    try:
        async with session_factory() as session:
            return await expire_due_jobs(session)
    finally:
        await engine.dispose()


def _run_expire_due_jobs() -> None:
    try:
        expired_count = asyncio.run(_expire_due_jobs_once_in_scheduler_thread())
        if expired_count:
            logger.info(
                "Daily expiry scheduler marked {} job(s) as expired.", expired_count
            )
    except Exception:
        logger.exception("Daily expiry scheduler failed while expiring due jobs.")


def create_job_expiry_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        _run_expire_due_jobs,
        "cron",
        hour=21,
        minute=15,
        second=0,
        id="expire-due-jobs-daily",
        replace_existing=True,
    )
    return scheduler


async def run_job_expiry_startup_check() -> None:
    try:
        expired_count = await _expire_due_jobs_once()
        if expired_count:
            logger.info(
                "Startup expiry check marked {} job(s) as expired.", expired_count
            )
    except Exception:
        logger.exception("Startup expiry check failed while expiring due jobs.")

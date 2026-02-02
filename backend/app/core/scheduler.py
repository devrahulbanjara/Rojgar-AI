from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import engine
from app.core.logging_config import logger
from app.services.job_service import JobService

scheduler = AsyncIOScheduler(timezone=settings.TIMEZONE)


def expire_jobs_task():
    with Session(engine) as db:
        try:
            count = JobService.auto_expire_jobs(db)
            if count > 0:
                logger.info(f"Cron Job: Successfully expired {count} jobs.")
            else:
                logger.trace("Cron Job: No jobs to expire.")
        except Exception as e:
            logger.error(f"Cron Job Error: {e}")


def start_scheduler():
    scheduler.add_job(
        expire_jobs_task,
        CronTrigger(hour=0, minute=0),
        id="auto_expire_jobs",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Background Scheduler Started (Nepal Time).")


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Background Scheduler Stopped.")

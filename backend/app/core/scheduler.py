from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.logging_config import logger
from app.services.job_service import JobService
from app.services.recruiter.shortlist_service import ShortlistService

scheduler = AsyncIOScheduler(timezone=settings.TIMEZONE)


async def expire_jobs_task():
    async with AsyncSessionLocal() as db:
        try:
            job_ids_to_process = await JobService.auto_expire_jobs(db)

            if job_ids_to_process:
                logger.info(
                    f"Cron: Expired jobs and triggering auto-shortlist for {len(job_ids_to_process)} jobs."
                )

                for job_id in job_ids_to_process:
                    try:
                        await ShortlistService.process_shortlisting(job_id)
                        logger.info(f"Auto-shortlisting completed for job {job_id}")
                    except Exception as e:
                        logger.error(f"Auto-shortlisting failed for job {job_id}: {e}")
            else:
                logger.trace(
                    "Cron Job: No jobs expired or required auto-shortlisting today."
                )

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

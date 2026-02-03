from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings
from app.core.logging_config import logger
from app.db.repositories.application_repo import JobApplicationRepository
from app.db.repositories.candidate_repo import CandidateProfileRepository
from app.db.repositories.job_repo import JobDescriptionRepository, JobRepository
from app.db.repositories.user_repo import UserRepository
from app.db.session import AsyncSessionLocal
from app.integrations.qdrant.vector_service import JobVectorService
from app.services.job_service import JobService
from app.services.recruiter.activity_events import ActivityEventEmitter
from app.services.recruiter.shortlist_service import ShortlistService

scheduler = AsyncIOScheduler(timezone=settings.TIMEZONE)


async def expire_jobs_task():
    async with AsyncSessionLocal() as db:
        try:
            job_repo = JobRepository(db)
            job_description_repo = JobDescriptionRepository(db)
            candidate_profile_repo = CandidateProfileRepository(db)
            user_repo = UserRepository(db)
            vector_service = JobVectorService()
            activity_emitter = ActivityEventEmitter()

            job_service = JobService(
                job_repo,
                job_description_repo,
                candidate_profile_repo,
                user_repo,
                vector_service,
                activity_emitter,
            )

            job_ids_to_process = await job_service.auto_expire_jobs()

            if job_ids_to_process:
                logger.info(
                    f"Cron: Expired jobs and triggering auto-shortlist for {len(job_ids_to_process)} jobs."
                )

                application_repo = JobApplicationRepository(db)
                shortlist_service = ShortlistService(application_repo, job_repo)

                for job_id in job_ids_to_process:
                    try:
                        await shortlist_service.process_shortlisting(job_id)
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

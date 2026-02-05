import asyncio
import uuid
from typing import Any

from app.agents.shortlisting.main import app as shortlist_agent
from app.core import get_datetime
from app.core.logging_config import logger
from app.db.models.application import ApplicationStatus, JobApplication
from app.db.models.job import ShortlistStatus
from app.db.repositories.application_repo import JobApplicationRepository
from app.db.repositories.job_repo import JobRepository
from app.services.candidate.resume_formatter import ResumeFormatter
from app.services.recruiter.reference_jd_formatter import ReferenceJDFormatter


class ShortlistService:
    def __init__(
        self,
        application_repo: JobApplicationRepository,
        job_repo: JobRepository,
    ):
        self.application_repo = application_repo
        self.job_repo = job_repo

    async def process_shortlisting(self, job_id: uuid.UUID) -> dict[str, Any]:
        """Process shortlisting for a job"""
        try:
            # 1. Check if job exists
            job = await self.job_repo.get_with_details(job_id)
            if not job:
                logger.error(f"Job {job_id} not found")
                return {"error": "Job not found", "processed": 0}

            # 2. Guard against concurrent processing
            if job.shortlist_status == ShortlistStatus.IN_PROGRESS:
                logger.warning(f"Shortlisting is already in progress for job {job_id}")
                return {
                    "message": "Shortlisting is already in progress",
                    "status": job.shortlist_status,
                    "processed": 0,
                }

            # 3. Set status to IN_PROGRESS
            await self.job_repo.update_shortlist_status(
                job_id, ShortlistStatus.IN_PROGRESS
            )
            logger.info(f"Started shortlisting process for job {job_id}")

            # Get applications for this job
            applications = await self.application_repo.get_by_job(job_id)
            applications = [
                app
                for app in applications
                if app.current_status == ApplicationStatus.APPLIED
            ]

            if not applications:
                logger.info(f"No applications to process for job {job_id}")
                # Set status to COMPLETED even if no applications
                await self.job_repo.update_shortlist_status(
                    job_id, ShortlistStatus.COMPLETED
                )
                return {
                    "processed": 0,
                    "message": "No applications to process",
                    "status": ShortlistStatus.COMPLETED,
                }

            # Format JD text
            jd_text = ReferenceJDFormatter.format_job_description(
                job.job_description,
                job_title=job.title,
                about_the_company=job.organization.name if job.organization else None,
            )
            if not jd_text:
                logger.error(
                    f"Failed to generate job description text for job {job_id}"
                )
                # Reset to NOT_STARTED on failure so it can be retried
                await self.job_repo.update_shortlist_status(
                    job_id, ShortlistStatus.NOT_STARTED
                )
                return {
                    "error": "Failed to generate job description text",
                    "processed": 0,
                }

            logger.info(
                f"Starting AI shortlisting for {len(applications)} applications"
            )

            # Shortlist all candidates
            tasks = [self._shortlist_candidate(app, jd_text) for app in applications]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            successful = sum(1 for r in results if isinstance(r, int))
            failed = len(results) - successful

            logger.info(
                f"AI shortlisting completed for {successful} applications, {failed} applications failed"
            )

            # 3. Set status to COMPLETED
            await self.job_repo.update_shortlist_status(
                job_id, ShortlistStatus.COMPLETED
            )

            return {
                "processed": successful,
                "failed": failed,
                "total_applications": len(applications),
                "job_id": str(job_id),
                "status": ShortlistStatus.COMPLETED,
            }
        except Exception as e:
            # 4. Critical: Reset to NOT_STARTED if it fails so it can be retried
            await self.job_repo.update_shortlist_status(
                job_id, ShortlistStatus.NOT_STARTED
            )
            logger.error(f"Error in shortlisting workflow for job {job_id}: {e}")
            return {"error": str(e), "processed": 0}

    async def _shortlist_candidate(
        self, application: JobApplication, jd_text: str
    ) -> int | None:
        """Shortlist a single candidate"""
        try:
            if not application.resume:
                logger.error(f"Application {application.application_id} has no resume")
                return None

            resume_text = ResumeFormatter.format_to_markdown(application.resume)
            if not resume_text:
                logger.error(
                    f"Failed to generate resume text for application {application.application_id}"
                )
                return None

            inputs = {
                "jd": jd_text,
                "resume": resume_text,
                "max_iterations": 2,
                "iteration": 0,
                "cto_evals": [],
                "hr_evals": [],
                "critiques": [],
                "is_satisfied": False,
            }

            config = {"configurable": {"thread_id": str(application.application_id)}}
            final_state = await shortlist_agent.ainvoke(inputs, config=config)

            score = final_state.get("final_score", 0)
            reason = final_state.get("final_reason", "No reason provided")

            # Update application with AI score
            await self.application_repo.update(
                application.application_id,
                ai_score=score,
                ai_analysis=reason,
                updated_at=get_datetime(),
            )

            logger.info(
                f"Candidate {application.application_id} shortlisted with score {score}/100"
            )
            return score

        except Exception as e:
            logger.error(
                f"Failed to shortlist candidate {application.application_id}: {e}"
            )
            return None

    async def get_shortlisting_summary(self, job_id: uuid.UUID) -> dict[str, Any]:
        """Get shortlisting summary for a job to show to the recruiter"""
        try:
            applications = await self.application_repo.get_by_job(job_id)
            total_applications = len(applications)
            ai_scored_count = sum(1 for app in applications if app.ai_score is not None)

            return {
                "job_id": str(job_id),
                "total_applications": total_applications,
                "ai_scored": ai_scored_count,
                "pending_ai_review": total_applications - ai_scored_count,
            }

        except Exception as e:
            logger.error(f"Failed to get shortlisting summary for job {job_id}: {e}")
            return {"error": str(e)}

import asyncio
import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core import get_datetime
from app.core.database import AsyncSessionLocal
from app.core.logging_config import logger
from app.models.application import ApplicationStatus, JobApplication
from app.models.job import JobPosting
from app.services.agents.shortlist.main import app as shortlist_agent
from app.services.candidate.resume_formatter import ResumeFormatter
from app.services.recruiter.reference_jd_formatter import ReferenceJDFormatter


class ShortlistService:
    @staticmethod
    async def process_shortlisting(job_id: uuid.UUID) -> dict[str, Any]:
        async with AsyncSessionLocal() as db:
            try:
                job_result = await db.execute(
                    select(JobPosting)
                    .options(
                        joinedload(JobPosting.job_description),
                        joinedload(JobPosting.organization),
                    )
                    .where(JobPosting.job_id == job_id)
                )
                job = job_result.scalar_one_or_none()
                if not job:
                    logger.error(f"Job {job_id} not found")
                    return {"error": "Job not found", "processed": 0}

                    applications_result = await db.execute(
                        select(JobApplication)
                        .options(
                            joinedload(JobApplication.resume).options(
                                joinedload(JobApplication.resume.work_experiences),
                                joinedload(JobApplication.resume.educations),
                                joinedload(JobApplication.resume.skills),
                                joinedload(JobApplication.resume.certifications),
                                joinedload(JobApplication.resume.social_links),
                            )
                        )
                        .where(
                            JobApplication.job_id == job_id,
                            JobApplication.current_status == ApplicationStatus.APPLIED,
                        )
                    )
                applications = applications_result.scalars().all()

                if not applications:
                    logger.info(f"No applications to process for job {job_id}")
                    return {"processed": 0, "message": "No applications to process"}

                jd_text = ReferenceJDFormatter.format_job_description(
                    job.job_description,
                    job_title=job.title,
                    about_the_company=f"{job.organization.name}"
                    if job.organization
                    else None,
                )

                logger.info(
                    f"Starting AI evaluation for {len(applications)} applications"
                )

                tasks = [
                    ShortlistService._evaluate_candidate(db, app, jd_text)
                    for app in applications
                ]
                results = await asyncio.gather(*tasks, return_exceptions=True)

                successful = sum(1 for r in results if isinstance(r, int))
                failed = len(results) - successful

                logger.info(
                    f"AI evaluation complete: {successful} successful, {failed} failed"
                )

                result = {
                    "processed": successful,
                    "failed": failed,
                    "total_applications": len(applications),
                    "job_id": str(job_id),
                }
                await db.commit()
                return result
            except Exception as e:
                logger.error(f"Error in shortlisting workflow for job {job_id}: {e}")
                await db.rollback()
                return {"error": str(e), "processed": 0}

    @staticmethod
    async def _evaluate_candidate(
        db: AsyncSession, application: JobApplication, jd_text: str
    ) -> int | None:
        try:
            resume_text = ResumeFormatter.format_to_markdown(application.resume)

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

            application.ai_score = score
            application.ai_analysis = reason
            application.updated_at = get_datetime()
            await db.commit()

            logger.info(f"Candidate {application.application_id} scored {score}/100")
            return score

        except Exception as e:
            logger.error(
                f"Failed to evaluate application {application.application_id}: {e}"
            )
            await db.rollback()
            return None

    @staticmethod
    async def get_shortlisting_summary(
        db: AsyncSession, job_id: uuid.UUID
    ) -> dict[str, Any]:
        try:
            ai_scored_result = await db.execute(
                select(func.count(JobApplication.application_id)).where(
                    JobApplication.job_id == job_id,
                    JobApplication.ai_score.is_not(None),
                )
            )
            ai_scored_count = ai_scored_result.scalar_one() or 0

            total_result = await db.execute(
                select(func.count(JobApplication.application_id)).where(
                    JobApplication.job_id == job_id
                )
            )
            total_applications = total_result.scalar_one() or 0

            return {
                "job_id": str(job_id),
                "total_applications": total_applications,
                "ai_scored": ai_scored_count,
                "pending_ai_review": total_applications - ai_scored_count,
            }

        except Exception as e:
            logger.error(f"Failed to get shortlisting summary for job {job_id}: {e}")
            return {"error": str(e)}

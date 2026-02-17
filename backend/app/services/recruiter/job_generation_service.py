import uuid

from app.agents.jd_generator import app as jd_agent
from app.core.logging_config import logger
from app.db.repositories.job_repo import ReferenceJDRepository
from app.schemas.agents.jd_generator import JobDescription, JobState
from app.services.recruiter.reference_jd_formatter import ReferenceJDFormatter
from app.services.recruiter.reference_jd_service import ReferenceJDService


class JobGenerationService:
    def __init__(
        self,
        job_repo,
        job_description_repo,
        reference_jd_repo: ReferenceJDRepository,
        organization_repo,
        vector_service,
    ):
        self.job_repo = job_repo
        self.job_description_repo = job_description_repo
        self.reference_jd_repo = reference_jd_repo
        self.organization_repo = organization_repo
        self.vector_service = vector_service

    async def generate_job_draft(
        self,
        title: str,
        raw_requirements: str,
        reference_jd_id: uuid.UUID | None = None,
        organization_id: uuid.UUID | None = None,
        current_draft: dict | None = None,
    ) -> JobDescription:
        """Generate a job draft using AI (Stateless/No-HITL)"""
        try:
            thread_config = {"configurable": {"thread_id": str(uuid.uuid4())}}
            reference_jd = ""
            logger.info(
                f"Starting job draft generation - title: {title}, has_reference: {reference_jd_id is not None}"
            )

            if reference_jd_id and organization_id:
                try:
                    reference_jd_service = ReferenceJDService(
                        self.reference_jd_repo, self.organization_repo
                    )
                    reference_jd_obj = (
                        await reference_jd_service.get_reference_jd_by_id(
                            reference_jd_id=reference_jd_id,
                            organization_id=organization_id,
                        )
                    )
                    if reference_jd_obj:
                        about_the_company = reference_jd_obj.about_the_company
                        reference_jd = ReferenceJDFormatter.format_reference_jd(
                            reference_jd_obj, about_the_company
                        )
                        logger.info(
                            f"Successfully loaded reference JD: {reference_jd_id}"
                        )
                except Exception as e:
                    logger.error(f"Error fetching reference JD: {e}", exc_info=True)
                    raise ValueError(
                        "Could not retrieve the selected reference job description."
                    )

            initial_state: JobState = {
                "title": title,
                "raw_requirements": raw_requirements,
                "reference_jd": reference_jd,
                "revision_count": 0,
                "draft": None,
                "feedback": "",
            }

            if current_draft:
                try:
                    # Extract feedback separately before creating JobDescription
                    initial_state["feedback"] = current_draft.get("feedback", "")
                    # Remove feedback from draft data before creating JobDescription
                    draft_data = {
                        k: v for k, v in current_draft.items() if k != "feedback"
                    }
                    draft: JobDescription = JobDescription(**draft_data)
                    initial_state["draft"] = draft
                    logger.info("Current draft loaded for revision")
                except Exception as e:
                    logger.warning(
                        f"Could not parse existing draft for revision: {e}",
                        exc_info=True,
                    )

            logger.info("Invoking JD agent...")
            result = await jd_agent.ainvoke(initial_state, config=thread_config)

            if not result or result.get("draft") is None:
                logger.error("AI agent failed to produce a draft")
                raise ValueError(
                    "The AI agent failed to produce a job description draft"
                )

            logger.info("Job draft generated successfully")
            return result["draft"]
        except Exception as e:
            logger.error(f"Error in generate_job_draft: {str(e)}", exc_info=True)
            raise

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
        """Generate a job draft using AI"""
        thread_id = str(uuid.uuid4())
        thread_config = {"configurable": {"thread_id": thread_id}}
        reference_jd = ""

        if reference_jd_id and organization_id:
            try:
                reference_jd_service = ReferenceJDService(
                    self.reference_jd_repo, self.organization_repo
                )
                reference_jd_obj = await reference_jd_service.get_reference_jd_by_id(
                    reference_jd_id=reference_jd_id,
                    organization_id=organization_id,
                )
                if reference_jd_obj:
                    about_the_company = reference_jd_obj.about_the_company
                    reference_jd = ReferenceJDFormatter.format_reference_jd(
                        reference_jd_obj, about_the_company
                    )
            except Exception as e:
                logger.error(f"Error fetching reference JD: {e}")
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
                draft: JobDescription = JobDescription(
                    job_summary=current_draft.get("job_summary", ""),
                    job_responsibilities=current_draft.get("job_responsibilities", []),
                    required_qualifications=current_draft.get(
                        "required_qualifications", []
                    ),
                    preferred=current_draft.get("preferred", []),
                    compensation_and_benefits=current_draft.get(
                        "compensation_and_benefits", []
                    ),
                )
                initial_state["feedback"] = current_draft.get("feedback", "")
                initial_state["draft"] = draft
            except Exception as e:
                logger.error(f"Failed to convert current_draft to JobDescription: {e}")

        result = await jd_agent.ainvoke(initial_state, config=thread_config)
        return result

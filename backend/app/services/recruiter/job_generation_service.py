import uuid

from sqlalchemy.orm import Session

from app.core.logging_config import logger
from app.schemas.agents.jd_generator import JobDescription, JobState
from app.services.agents.jd_generator import app as jd_agent
from app.services.recruiter.reference_jd_formatter import ReferenceJDFormatter
from app.services.recruiter.reference_jd_service import ReferenceJDService


class JobGenerationService:
    @staticmethod
    def generate_job_draft(
        title: str,
        raw_requirements: str,
        db: Session | None = None,
        reference_jd_id: uuid.UUID | None = None,
        organization_id: uuid.UUID | None = None,
        current_draft: dict | None = None,
    ) -> JobDescription:
        thread_id = str(uuid.uuid4())

        thread_config = {
            "configurable": {"thread_id": thread_id},
        }

        reference_jd = ""

        if reference_jd_id and db and organization_id:
            try:
                reference_jd_obj, about_the_company = (
                    ReferenceJDService.get_reference_jd_by_id(
                        db=db,
                        reference_jd_id=reference_jd_id,
                        organization_id=organization_id,
                    )
                )
                if reference_jd_obj:
                    reference_jd = ReferenceJDFormatter.format_reference_jd(
                        reference_jd_obj, about_the_company
                    )
            except Exception:
                pass

        # Build initial state
        initial_state: JobState = {
            "title": title,
            "raw_requirements": raw_requirements,
            "reference_jd": reference_jd,
            "revision_count": 0,
            "draft": None,
            "feedback": "",
        }

        # Runs only if it is a revision
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

        result = jd_agent.invoke(initial_state, config=thread_config)
        return result

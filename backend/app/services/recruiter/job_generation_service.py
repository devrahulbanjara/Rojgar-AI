import os
import uuid

from sqlalchemy.orm import Session

from app.core import settings
from app.models.agents.jd_generator import JDGenNode, JobState
from app.services.agents.jd_generator import app as jd_agent
from app.services.agents.jd_generator import reference_jd
from app.services.recruiter.reference_jd_formatter import ReferenceJDFormatter
from app.services.recruiter.reference_jd_service import ReferenceJDService

os.environ.setdefault(
    "LANGCHAIN_TRACING_V2", str(settings.LANGCHAIN_TRACING_V2).lower()
)
if settings.LANGCHAIN_API_KEY:
    os.environ.setdefault("LANGCHAIN_API_KEY", settings.LANGCHAIN_API_KEY)
if settings.LANGCHAIN_ENDPOINT:
    os.environ.setdefault("LANGCHAIN_ENDPOINT", settings.LANGCHAIN_ENDPOINT)
if settings.LANGCHAIN_PROJECT:
    os.environ.setdefault("LANGCHAIN_PROJECT", settings.LANGCHAIN_PROJECT)


class JobGenerationService:
    @staticmethod
    def generate_job_draft(
        requirements: str,
        db: Session | None = None,
        reference_jd_id: str | None = None,
        organization_id: str | None = None,
        current_draft: dict | None = None,
    ) -> JDGenNode:
        thread_id = str(uuid.uuid4())
        thread_config = {
            "configurable": {"thread_id": thread_id},
            "run_name": "jd_generation_workflow",
            "tags": ["jd_generation", "langgraph", "job_description"],
            "metadata": {
                "requirements_length": len(requirements),
                "thread_id": thread_id,
                "workflow": "jd_generator",
            },
        }

        format_reference = reference_jd  # Default fallback
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
                    format_reference = ReferenceJDFormatter.format_reference_jd(
                        reference_jd_obj, about_the_company
                    )
            except Exception:
                pass

        # Build initial state
        initial_state: JobState = {
            "requirements": requirements,
            "format_reference": format_reference,
            "revision_count": 0,
            "draft": None,
            "feedback": "",
            "final_doc": None,
        }

        if current_draft:
            try:
                draft_node = JDGenNode(
                    about_the_company=current_draft.get("about_company", ""),
                    job_title=current_draft.get("title", ""),
                    role_overview=current_draft.get("description", ""),
                    required_skills_and_experience=current_draft.get(
                        "requiredSkillsAndExperience", []
                    ),
                    nice_to_have=current_draft.get("niceToHave", []),
                    what_company_offers=current_draft.get("benefits", []),
                )
                initial_state["draft"] = draft_node
                if "Revision Request:" in requirements:
                    parts = requirements.split("Revision Request:", 1)
                    initial_state["requirements"] = parts[0].strip()
                    initial_state["feedback"] = parts[1].strip()
            except Exception as e:

                import logging
                logging.warning(f"Failed to convert current_draft to JDGenNode: {e}")
                pass

        result = jd_agent.invoke(initial_state, config=thread_config)

        if "draft" in result and result["draft"]:
            return result["draft"]
        raise ValueError("Agent failed to generate a draft job description.")

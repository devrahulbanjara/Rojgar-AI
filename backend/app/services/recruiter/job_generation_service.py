import os
import uuid

from app.core import settings
from app.models.agents.jd_generator import JDGenNode
from app.services.agents.jd_generator import app as jd_agent
from app.services.agents.jd_generator import reference_jd

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
    def generate_job_draft(requirements: str) -> JDGenNode:
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

        initial_state = {
            "requirements": requirements,
            "format_reference": reference_jd,
            "revision_count": 0,
        }

        result = jd_agent.invoke(initial_state, config=thread_config)

        if "draft" in result and result["draft"]:
            return result["draft"]
        raise ValueError("Agent failed to generate a draft job description.")

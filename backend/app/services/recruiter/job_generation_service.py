import os
import uuid

from app.core import settings
from app.models.agents.jd_generator import JDGenNode
from app.services.agents.jd_generator import app as jd_agent
from app.services.agents.jd_generator import reference_jd

# Ensure LangSmith environment variables are set for tracing
# This must be done before invoking the workflow
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
        """
        Generates a job description draft using the JD Generator Agent.

        Args:
            requirements: The raw job requirements provided by the user.

        Returns:
            JDGenNode: The generated job description structure.
        """
        # Generate a unique thread ID for this execution
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

        # Invoke the agent
        # We expect the agent to run until it hits the human_review interrupt or finishes.
        # For the initial generation, it should stop at human_review with a draft.
        result = jd_agent.invoke(initial_state, config=thread_config)

        # Check if we have a draft in the state (either from interrupt or final state)
        # The invoke method returns the final state of the execution.
        # If it hit an interrupt, we might need to inspect the snapshot or the returned state might contain the draft.
        # Based on main.py, 'result' is the state.

        if "draft" in result and result["draft"]:
            return result["draft"]

        # If for some reason draft is missing (shouldn't happen if agent works as expected)
        raise ValueError("Agent failed to generate a draft job description.")

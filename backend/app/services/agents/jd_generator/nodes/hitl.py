from langgraph.types import interrupt
from langsmith import traceable

from app.models.agents.jd_generator import JobState


@traceable(
    name="jd_human_review_node",
    tags=["node:human_review", "jd_generation", "hitl"],
    metadata={"node_type": "human_review", "purpose": "human_in_the_loop_checkpoint"},
)
def human_node(state: JobState) -> dict:
    """Human review checkpoint - actual input handled via workflow interruption."""
    draft = state["draft"]

    review_payload = {
        "revision_number": state.get("revision_count", 0),
        "about_company": draft.about_the_company,
        "role": draft.role_overview,
        "requirements": draft.required_skills_and_experience,
        "nice_to_have": draft.nice_to_have,
        "offers": draft.what_company_offers,
    }

    feedback = interrupt(review_payload)

    return {"feedback": feedback}

from app.models.agents.jd_generator import JobState
from langgraph.types import interrupt


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

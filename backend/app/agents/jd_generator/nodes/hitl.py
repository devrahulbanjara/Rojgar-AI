from langgraph.types import interrupt

from app.schemas.agents.jd_generator import JobState


def human_node(state: JobState) -> dict:
    draft_job_description = state["draft"]
    review_payload = {
        "revision_number": state.get("revision_count", 0),
        "job_summary": draft_job_description.job_summary,
        "job_responsibilities": draft_job_description.job_responsibilities,
        "required_qualifications": draft_job_description.required_qualifications,
        "preferred": draft_job_description.preferred,
        "compensation_and_benefits": draft_job_description.compensation_and_benefits,
    }
    feedback = interrupt(review_payload)
    return {"feedback": feedback}

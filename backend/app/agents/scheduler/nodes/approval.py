from typing import Literal

from langgraph.types import interrupt

from app.schemas.agents.interview_scheduling import InterviewSchedulingState


def human_approval_gate(state: InterviewSchedulingState) -> dict:
    if state.get("auto_approved", False):
        return {"approved": True}

    review_payload = {
        "application_id": state["application_id"],
        "candidate_name": state["name"],
        "candidate_email": state["email"],
        "status": state["status"],
        "score": state["score"],
        "feedback": state["feedback"],
        "subject": state["subject"],
        "draft_email_html": state["draft_email_html"],
    }

    approval = interrupt(review_payload)
    return {"approved": approval}


def approval_router(
    state: InterviewSchedulingState,
) -> Literal["send_email", "wrap_up"]:
    if state.get("approved", False):
        return "send_email"
    return "wrap_up"

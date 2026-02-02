from typing import Literal

from langgraph.types import interrupt

from app.schemas.agents.interview_scheduling import InterviewSchedulingState


def human_approval_gate(state: InterviewSchedulingState) -> dict:
    if state.get("auto_approved", False):
        return {"approved": True}
    review_payload = {
        "candidate_name": state["name"],
        "candidate_email": state["email"],
        "reason": state["reason"],
        "draft_email": state["draft_email"],
    }
    approval = interrupt(review_payload)
    return {"approved": approval}


def approval_router(
    state: InterviewSchedulingState,
) -> Literal["send_email", "wrap_up"]:
    if state.get("approved", False):
        return "send_email"
    return "wrap_up"

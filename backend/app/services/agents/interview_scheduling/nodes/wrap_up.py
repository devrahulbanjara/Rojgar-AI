from app.schemas.agents.interview_scheduling import InterviewSchedulingState


def wrap_up(state: InterviewSchedulingState) -> dict:
    return {
        "name": state["name"],
        "email": state["email"],
        "reason": state["reason"],
        "draft_email": state["draft_email"],
        "approved": state["approved"],
        "send_status": state.get("send_status", "not_sent"),
    }

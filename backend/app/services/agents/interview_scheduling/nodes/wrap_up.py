from app.models.agents.interview_scheduling import InterviewSchedulingState


def wrap_up(state: InterviewSchedulingState) -> dict:
    """Finalize and return the workflow state."""
    return {
        "name": state["name"],
        "email": state["email"],
        "reason": state["reason"],
        "draft_email": state["draft_email"],
        "approved": state["approved"],
        "send_status": state.get("send_status", "not_sent"),
    }

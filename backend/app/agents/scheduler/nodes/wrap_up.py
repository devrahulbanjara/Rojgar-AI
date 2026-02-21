from app.schemas.agents.interview_scheduling import InterviewSchedulingState


def wrap_up(state: InterviewSchedulingState) -> dict:
    return {
        "application_id": state["application_id"],
        "name": state["name"],
        "email": state["email"],
        "status": state["status"],
        "score": state["score"],
        "feedback": state["feedback"],
        "subject": state["subject"],
        "draft_email_html": state["draft_email_html"],
        "approved": state["approved"],
        "send_status": state.get("send_status", "not_sent"),
        "retry_count": state["retry_count"],
    }

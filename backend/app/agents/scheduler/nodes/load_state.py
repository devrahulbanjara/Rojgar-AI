from app.schemas.agents.interview_scheduling import InterviewSchedulingState


def load_state(state: InterviewSchedulingState) -> dict:
    return {
        "application_id": state["application_id"],
        "name": state["name"],
        "email": state["email"],
        "status": state["status"],
        "score": state["score"],
        "feedback": state["feedback"],
        "subject": None,
        "draft_email_html": None,
        "approved": False,
        "auto_approved": state.get("auto_approved", False),
        "send_status": None,
        "retry_count": state.get("retry_count", 0),
    }

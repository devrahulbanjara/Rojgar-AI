from app.integrations.google.gmail_client import send_interview_email
from app.schemas.agents.interview_scheduling import InterviewSchedulingState


def send_email(state: InterviewSchedulingState) -> dict:
    return send_interview_email(
        to_email=state["email"],
        candidate_name=state["name"],
        html_content=state["draft_email"],
    )

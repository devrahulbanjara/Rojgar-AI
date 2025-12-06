"""
Send email node - Send the interview scheduling email.
"""

from app.models.agents.interview_scheduling import InterviewSchedulingState
from ..email_service import send_interview_email


def send_email(state: InterviewSchedulingState) -> dict:
    """Send the interview scheduling email to the candidate."""
    return send_interview_email(
        to_email=state["email"],
        candidate_name=state["name"],
        html_content=state["draft_email"],
    )


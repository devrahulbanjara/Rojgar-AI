"""
Send email node - Send the interview scheduling email.
"""

from langsmith import traceable

from app.models.agents.interview_scheduling import InterviewSchedulingState

from ..email_service import send_interview_email


@traceable(
    name="interview_send_email_node",
    tags=["node:send_email", "interview_scheduling"],
    metadata={"node_type": "send_email", "purpose": "send_interview_email"},
)
def send_email(state: InterviewSchedulingState) -> dict:
    """Send the interview scheduling email to the candidate."""
    return send_interview_email(
        to_email=state["email"],
        candidate_name=state["name"],
        html_content=state["draft_email"],
    )

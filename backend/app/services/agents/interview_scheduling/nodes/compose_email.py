"""
Compose email node - Generate the email draft content.
"""

from langsmith import traceable

from app.core.config import settings
from app.models.agents.interview_scheduling import InterviewSchedulingState

from ..templates import get_interview_email_template


@traceable(
    name="interview_compose_email_node",
    tags=["node:compose_email", "interview_scheduling"],
    metadata={"node_type": "compose_email", "purpose": "generate_email_draft"},
)
def compose_email_draft(state: InterviewSchedulingState) -> dict:
    """Compose the HTML email draft for the candidate."""
    name = state["name"]
    reason = state["reason"]

    html_body = get_interview_email_template(
        name=name,
        reason=reason,
        booking_link=settings.BOOKING_LINK,
        contact_email=settings.GMAIL_USER,
    )

    return {"draft_email": html_body}

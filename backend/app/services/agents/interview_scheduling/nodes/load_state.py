"""
Load state node - Initialize the workflow state.
"""

from app.models.agents.interview_scheduling import InterviewSchedulingState


def load_state(state: InterviewSchedulingState) -> dict:
    """Initialize workflow state with default values."""
    return {
        "name": state["name"],
        "email": state["email"],
        "reason": state["reason"],
        "draft_email": None,
        "approved": False,
        "auto_approved": state.get("auto_approved", False),
        "send_status": None,
    }

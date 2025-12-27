"""
Wrap up node - Finalize the workflow state.
"""

from langsmith import traceable

from app.models.agents.interview_scheduling import InterviewSchedulingState


@traceable(
    name="interview_wrap_up_node",
    tags=["node:wrap_up", "interview_scheduling"],
    metadata={"node_type": "wrap_up", "purpose": "finalize_workflow_state"},
)
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

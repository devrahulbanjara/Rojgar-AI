from app.models.agents.interview_scheduling import InterviewSchedulingState
from langsmith import traceable


@traceable(
    name="interview_load_state_node",
    tags=["node:load_state", "interview_scheduling"],
    metadata={"node_type": "load_state", "purpose": "initialize_workflow_state"},
)
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

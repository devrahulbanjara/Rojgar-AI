from typing import Literal

from langsmith import traceable

from app.models.agents.jd_generator import JobState


@traceable(
    name="jd_router_node",
    tags=["node:router", "jd_generation"],
    metadata={"node_type": "router", "purpose": "route_based_on_feedback"},
)
def router(state: JobState) -> Literal["finalize", "revise"]:
    """Route to finalize if approved, otherwise revise."""
    feedback = state.get("feedback", "").strip().lower()
    return "finalize" if feedback == "approved" else "revise"

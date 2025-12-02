from typing import Literal
from app.models.agents.jd_generator import JobState


def router(state: JobState) -> Literal["finalize", "revise"]:
    """Route to finalize if approved, otherwise revise."""
    feedback = state.get("feedback", "").strip().lower()
    return "finalize" if feedback == "approved" else "revise"

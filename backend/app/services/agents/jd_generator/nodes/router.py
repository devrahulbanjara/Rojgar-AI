from typing import Literal
from app.schemas.agents.jd_generator import JobState

def router(state: JobState) -> Literal["finalize", "revise"]:
    feedback = state.get("feedback", "").strip().lower()
    return "finalize" if feedback == "approved" else "revise"

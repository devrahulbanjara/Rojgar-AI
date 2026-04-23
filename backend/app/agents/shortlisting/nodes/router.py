from app.agents.shortlisting.schemas import ShortlistState


def router(state: ShortlistState) -> str | list[str]:
    """Route to the final node or another CTO/HR reflection round."""
    if state["is_satisfied"] or state["iteration"] >= state["max_iterations"]:
        return "final"
    return ["cto", "hr"]

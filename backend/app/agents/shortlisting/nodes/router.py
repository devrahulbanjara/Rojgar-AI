from app.agents.shortlisting.schemas import ShortlistState

CONFIDENCE_EARLY_EXIT = 0.7


def router(state: ShortlistState) -> str | list[str]:
    """Route to the final node or another CTO/HR reflection round."""
    if (
        state["is_satisfied"]
        or state.get("confidence", 0.0) >= CONFIDENCE_EARLY_EXIT
        or state["iteration"] >= state["max_iterations"]
    ):
        return "final"
    return ["cto", "hr"]

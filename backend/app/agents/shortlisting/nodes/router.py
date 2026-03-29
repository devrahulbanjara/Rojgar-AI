from app.agents.shortlisting.schemas import ShortlistState


def router(state: ShortlistState) -> str | list[str]:
    if state["is_satisfied"] or state["iteration"] >= state["max_iterations"]:
        return "final"
    return ["cto", "hr"]

from app.schemas.agents.shortlist import ShortlistState


def router(state: ShortlistState) -> list[str] | str:
    if state["is_satisfied"] or state["iteration"] >= state["max_iterations"]:
        return "final"
    return ["cto", "hr"]

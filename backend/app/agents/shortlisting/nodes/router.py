from app.agents.shortlisting.schemas import ShortlistState

CONFIDENCE_EARLY_EXIT = 0.7


def route_after_personas(state: ShortlistState) -> str:
    """Skip the critique when no further persona round is allowed.

    `max_iterations` is the number of persona rounds. With a single round the
    critique could never change the outcome, so calling it would only add cost.
    """
    if state["iteration"] + 1 >= state["max_iterations"]:
        return "final"
    return "critique"


def router(state: ShortlistState) -> str | list[str]:
    """Route to the final node or another CTO/HR reflection round.

    Exit only when the critique is satisfied *and* confident in that verdict.
    A confident "not satisfied" verdict must trigger a reflection round, not ship.
    """
    satisfied = (
        state["is_satisfied"] and state.get("confidence", 0.0) >= CONFIDENCE_EARLY_EXIT
    )
    if satisfied or state["iteration"] >= state["max_iterations"]:
        return "final"
    return ["cto", "hr"]

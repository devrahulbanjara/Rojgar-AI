from langgraph.graph import END, START, StateGraph

from app.agents.shortlisting.nodes import (
    critique_node,
    cto_node,
    final_node,
    hr_node,
    router,
)
from app.agents.shortlisting.schemas import ShortlistState


def create_workflow():
    """Build the uncompiled LangGraph shortlisting workflow."""
    workflow = StateGraph(ShortlistState)
    workflow.add_node("cto", cto_node)
    workflow.add_node("hr", hr_node)
    workflow.add_node("critique", critique_node)
    workflow.add_node("final", final_node)
    workflow.add_edge(START, "cto")
    workflow.add_edge(START, "hr")
    workflow.add_edge(["cto", "hr"], "critique")
    workflow.add_conditional_edges(
        "critique", router, {"cto": "cto", "hr": "hr", "final": "final"}
    )
    workflow.add_edge("final", END)
    return workflow

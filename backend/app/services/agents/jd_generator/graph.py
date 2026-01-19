from langgraph.graph import END, START, StateGraph
from app.models.agents.jd_generator import JobState
from .nodes import *


def create_workflow() -> StateGraph:
    workflow = StateGraph(JobState)
    workflow.add_node("generator", generator_node)
    workflow.add_node("human_review", human_node)
    workflow.add_node("finalizer", finalizer_node)

    workflow.add_edge(START, "generator")
    workflow.add_edge("generator", "human_review")
    workflow.add_conditional_edges(
        "human_review", router, {"finalize": "finalizer", "revise": "generator"}
    )
    workflow.add_edge("finalizer", END)

    return workflow

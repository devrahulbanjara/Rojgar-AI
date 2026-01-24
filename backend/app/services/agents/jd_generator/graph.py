from langgraph.graph import END, START, StateGraph

from app.schemas.agents.jd_generator import JobState

from .nodes import generator_node, human_node, router


def create_workflow() -> StateGraph:
    workflow = StateGraph(JobState)
    workflow.add_node("generator", generator_node)
    workflow.add_node("human_review", human_node)

    workflow.add_edge(START, "generator")
    workflow.add_edge("generator", "human_review")

    workflow.add_conditional_edges(
        "human_review", router, {"finalize": END, "revise": "generator"}
    )

    return workflow

from langgraph.graph import END, START, StateGraph

from app.schemas.agents.jd_generator import JobState

from .nodes import generator_node


def create_workflow() -> StateGraph:
    workflow = StateGraph(JobState)
    workflow.add_node("generator", generator_node)
    workflow.add_edge(START, "generator")
    workflow.add_edge("generator", END)
    return workflow

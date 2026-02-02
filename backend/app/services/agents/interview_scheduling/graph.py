from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from app.schemas.agents.interview_scheduling import InterviewSchedulingState

from .nodes import (
    approval_router,
    compose_email_draft,
    human_approval_gate,
    load_state,
    send_email,
    wrap_up,
)


def create_workflow() -> StateGraph:
    workflow = StateGraph(InterviewSchedulingState)
    workflow.add_node("load_state", load_state)
    workflow.add_node("compose_email_draft", compose_email_draft)
    workflow.add_node("human_approval_gate", human_approval_gate)
    workflow.add_node("send_email", send_email)
    workflow.add_node("wrap_up", wrap_up)
    workflow.add_edge(START, "load_state")
    workflow.add_edge("load_state", "compose_email_draft")
    workflow.add_edge("compose_email_draft", "human_approval_gate")
    workflow.add_conditional_edges(
        "human_approval_gate",
        approval_router,
        {"send_email": "send_email", "wrap_up": "wrap_up"},
    )
    workflow.add_edge("send_email", "wrap_up")
    workflow.add_edge("wrap_up", END)
    memory = MemorySaver()
    return workflow.compile(checkpointer=memory)

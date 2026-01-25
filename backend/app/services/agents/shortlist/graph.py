from backend.app.schemas.agents.shortlist.schemas import AgentState
from backend.app.services.agents.shortlist.nodes import (
    critique_node,
    final_decision_node,
    hr_evaluation_node,
    parse_jd_node,
    parse_resume_node,
    sync_node,
    technical_evaluation_node,
)
from langgraph.graph import END, START, StateGraph

workflow = StateGraph(AgentState)

workflow.add_node("parse_jd", parse_jd_node)
workflow.add_node("parse", parse_resume_node)
workflow.add_node("technical", technical_evaluation_node)
workflow.add_node("hr", hr_evaluation_node)
workflow.add_node("sync", sync_node)
workflow.add_node("critique", critique_node)
workflow.add_node("decision", final_decision_node)

workflow.add_edge(START, "parse_jd")
workflow.add_edge("parse_jd", "parse")
workflow.add_edge("parse", "technical")
workflow.add_edge("parse", "hr")

workflow.add_conditional_edges(
    "technical",
    lambda s: "continue" if s.get("tech_messages") else "sync",
    {"continue": "technical", "sync": "sync"},
)

workflow.add_conditional_edges(
    "hr",
    lambda s: "continue" if s.get("hr_messages") else "sync",
    {"continue": "hr", "sync": "sync"},
)

workflow.add_conditional_edges(
    "sync",
    lambda s: "critique" if (s.get("tech_done") and s.get("hr_done")) else "sync",
    {"critique": "critique", "sync": "sync"},
)

workflow.add_conditional_edges(
    "critique",
    lambda s: (
        "rework"
        if (
            s.get("critique")
            and s.get("critique").requires_rework
            and s.get("iteration", 0) < s.get("max_iterations", 2)
        )
        else "decision"
    ),
    {"rework": "parse", "decision": "decision"},
)

workflow.add_edge("decision", END)

app = workflow.compile()

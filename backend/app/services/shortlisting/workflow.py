from langgraph.graph import StateGraph, END
from models import WorkflowState
from nodes import (
    parse_job_description,
    extract_resume_structure,
    normalize_resumes,
    score_candidates,
    generate_report,
)


def create_workflow():
    workflow = StateGraph(WorkflowState)

    workflow.add_node("parse_jd", parse_job_description)
    workflow.add_node("extract_structure", extract_resume_structure)
    workflow.add_node("normalize", normalize_resumes)
    workflow.add_node("score", score_candidates)
    workflow.add_node("report", generate_report)

    workflow.set_entry_point("parse_jd")
    workflow.add_edge("parse_jd", "extract_structure")
    workflow.add_edge("extract_structure", "normalize")
    workflow.add_edge("normalize", "score")
    workflow.add_edge("score", "report")
    workflow.add_edge("report", END)

    return workflow.compile()

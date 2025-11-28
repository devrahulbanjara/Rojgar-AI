from langgraph.graph import StateGraph, END, START

from .schemas import WorkflowState
from .nodes import *


def create_workflow() -> StateGraph:
    workflow = StateGraph(WorkflowState)

    workflow.add_node("parse_jd", parse_job_description)
    workflow.add_node("extract_resumes", extract_resume_structure)
    workflow.add_node("evaluate_skills", evaluate_skills)
    workflow.add_node("evaluate_experience_years", evaluate_experience_years)
    workflow.add_node("evaluate_work_alignment", evaluate_work_alignment)
    workflow.add_node("evaluate_projects", evaluate_projects)
    workflow.add_node("evaluate_degree", evaluate_degree)
    workflow.add_node("aggregate_scores", aggregate_scores)
    workflow.add_node("generate_report", generate_report)

    workflow.add_edge(START, "parse_jd")
    workflow.add_edge("parse_jd", "extract_resumes")

    workflow.add_edge("extract_resumes", "evaluate_skills")
    workflow.add_edge("extract_resumes", "evaluate_experience_years")
    workflow.add_edge("extract_resumes", "evaluate_work_alignment")
    workflow.add_edge("extract_resumes", "evaluate_projects")
    workflow.add_edge("extract_resumes", "evaluate_degree")

    workflow.add_edge("evaluate_skills", "aggregate_scores")
    workflow.add_edge("evaluate_experience_years", "aggregate_scores")
    workflow.add_edge("evaluate_work_alignment", "aggregate_scores")
    workflow.add_edge("evaluate_projects", "aggregate_scores")
    workflow.add_edge("evaluate_degree", "aggregate_scores")

    workflow.add_edge("aggregate_scores", "generate_report")
    workflow.add_edge("generate_report", END)

    return workflow.compile()

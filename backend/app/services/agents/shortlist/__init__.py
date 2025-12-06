"""
Shortlist Agent package - Resume screening and candidate evaluation.

This module provides the resume shortlisting workflow using LangGraph.
Import from here instead of individual submodules for a cleaner API.

Example:
    from app.services.agents.shortlist import create_workflow, discover_resume_files
    from app.services.agents.shortlist import WorkflowState, CandidateScore
"""

# Schemas (data models for the workflow)
from app.models.agents.shortlist import (
    CandidateScore,
    EvaluationScore,
    JobRequirements,
    ResumeStructured,
    WorkflowState,
)

# Services
from .document_processor import DocumentProcessor

# File utilities
from .file_handler import (
    discover_resume_files,
    read_job_description,
    save_json_report,
    save_text_report,
)

# Workflow
from .graph import create_workflow
from .llm_service import get_llm

# Node functions (for advanced usage)
from .nodes import (
    aggregate_scores,
    evaluate_degree,
    evaluate_experience_years,
    evaluate_projects,
    evaluate_skills,
    evaluate_work_alignment,
    extract_resume_structure,
    generate_report,
    parse_job_description,
)

# Prompt templates
from .templates import (
    DEGREE_MAPPER_PROMPT,
    JOB_DESCRIPTION_PARSER_PROMPT,
    PROJECT_EVALUATION_PROMPT,
    RESUME_PARSER_PROMPT,
    WORK_ALIGNMENT_PROMPT,
)

__all__ = [
    # Schemas
    "ResumeStructured",
    "JobRequirements",
    "EvaluationScore",
    "CandidateScore",
    "WorkflowState",
    # Prompts
    "JOB_DESCRIPTION_PARSER_PROMPT",
    "RESUME_PARSER_PROMPT",
    "WORK_ALIGNMENT_PROMPT",
    "PROJECT_EVALUATION_PROMPT",
    "DEGREE_MAPPER_PROMPT",
    # Services
    "DocumentProcessor",
    "get_llm",
    # Workflow
    "create_workflow",
    # Nodes
    "parse_job_description",
    "extract_resume_structure",
    "evaluate_skills",
    "evaluate_experience_years",
    "evaluate_work_alignment",
    "evaluate_projects",
    "evaluate_degree",
    "aggregate_scores",
    "generate_report",
    # File utilities
    "read_job_description",
    "discover_resume_files",
    "save_json_report",
    "save_text_report",
]

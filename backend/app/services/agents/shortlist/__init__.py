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
    ResumeStructured,
    JobRequirements,
    EvaluationScore,
    CandidateScore,
    WorkflowState,
)

# Prompt templates
from .templates import (
    JOB_DESCRIPTION_PARSER_PROMPT,
    RESUME_PARSER_PROMPT,
    WORK_ALIGNMENT_PROMPT,
    PROJECT_EVALUATION_PROMPT,
    DEGREE_MAPPER_PROMPT,
)

# Services
from .document_processor import DocumentProcessor
from .llm_service import get_llm

# Workflow
from .graph import create_workflow

# Node functions (for advanced usage)
from .nodes import (
    parse_job_description,
    extract_resume_structure,
    evaluate_skills,
    evaluate_experience_years,
    evaluate_work_alignment,
    evaluate_projects,
    evaluate_degree,
    aggregate_scores,
    generate_report,
)

# File utilities
from .file_handler import (
    read_job_description,
    discover_resume_files,
    save_json_report,
    save_text_report,
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

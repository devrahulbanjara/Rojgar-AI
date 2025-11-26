# config/__init__.py
"""Configuration module for ATS screening system."""

# models/__init__.py
"""Data models and schemas."""
from .schemas import (
    ResumeStructured,
    JobRequirements,
    EvaluationScore,
    CandidateScore,
    WorkflowState,
)

__all__ = [
    "ResumeStructured",
    "JobRequirements",
    "EvaluationScore",
    "CandidateScore",
    "WorkflowState",
]

# prompts/__init__.py
"""Prompt templates for LLM interactions."""
from .templates import (
    JOB_DESCRIPTION_PARSER_PROMPT,
    RESUME_PARSER_PROMPT,
    WORK_ALIGNMENT_PROMPT,
    PROJECT_EVALUATION_PROMPT,
    DEGREE_MAPPER_PROMPT,
)

__all__ = [
    "JOB_DESCRIPTION_PARSER_PROMPT",
    "RESUME_PARSER_PROMPT",
    "WORK_ALIGNMENT_PROMPT",
    "PROJECT_EVALUATION_PROMPT",
    "DEGREE_MAPPER_PROMPT",
]

# services/__init__.py
"""Services for document processing and LLM interactions."""
from .document_processor import DocumentProcessor
from .llm_service import get_llm

__all__ = ["DocumentProcessor", "get_llm"]

# workflows/__init__.py
"""Workflow definitions and node functions."""
from .graph import create_workflow
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

__all__ = [
    "create_workflow",
    "parse_job_description",
    "extract_resume_structure",
    "evaluate_skills",
    "evaluate_experience_years",
    "evaluate_work_alignment",
    "evaluate_projects",
    "evaluate_degree",
    "aggregate_scores",
    "generate_report",
]

# utils/__init__.py
"""Utility functions for file handling."""
from .file_handler import (
    read_job_description,
    discover_resume_files,
    save_json_report,
    save_text_report,
)

__all__ = [
    "read_job_description",
    "discover_resume_files",
    "save_json_report",
    "save_text_report",
]
import os

from app.core import settings
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
    read_job_description,
    save_json_report,
    save_text_report,
    validate_resume_path,
)

# Main entry point
from .main import run_shortlist_workflow

# Workflow
from .graph import create_workflow
from .llm_service import get_llm

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

os.environ.setdefault(
    "LANGCHAIN_TRACING_V2", str(settings.LANGCHAIN_TRACING_V2).lower()
)
os.environ.setdefault("LANGCHAIN_API_KEY", settings.LANGCHAIN_API_KEY)
os.environ.setdefault("LANGCHAIN_ENDPOINT", settings.LANGCHAIN_ENDPOINT)
os.environ.setdefault("LANGCHAIN_PROJECT", settings.LANGCHAIN_PROJECT)

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
    "validate_resume_path",
    "save_json_report",
    "save_text_report",
    # Main entry point
    "run_shortlist_workflow",
]

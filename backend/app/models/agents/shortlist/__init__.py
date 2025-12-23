"""
Shortlist Agent models package - Pydantic models for resume screening.

This module provides data models used by the resume shortlisting workflow.
Import from here instead of individual submodules for a cleaner API.

Example:
    from app.models.agents.shortlist import WorkflowState, CandidateScore
    from app.models.agents.shortlist import ResumeStructured, JobRequirements
"""

# Schemas (data models for the workflow)
from .schemas import (
    ResumeStructured,
    JobRequirements,
    EvaluationScore,
    CandidateBreakdown,
    CandidateScore,
    WorkflowState,
)

__all__ = [
    # Schemas
    "ResumeStructured",
    "JobRequirements",
    "EvaluationScore",
    "CandidateBreakdown",
    "CandidateScore",
    "WorkflowState",
]


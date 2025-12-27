"""
Agents models package - Pydantic models for AI agents.

This module provides data models used by AI-powered automation agents.
Import from here instead of individual submodules for a cleaner API.

Example:
    from app.models.agents import shortlist
    from app.models.agents.shortlist import WorkflowState, CandidateScore

    from app.models.agents import interview_scheduling
    from app.models.agents.interview_scheduling import InterviewSchedulingState
"""

from . import interview_scheduling, shortlist

__all__ = [
    "shortlist",
    "interview_scheduling",
]

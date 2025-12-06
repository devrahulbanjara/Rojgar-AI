"""
Agents package - AI-powered automation services.

This module provides agent-based services for intelligent automation.
Import from here instead of individual submodules for a cleaner API.

Example:
    from app.services.agents import shortlist
    from app.services.agents.shortlist import create_workflow, discover_resume_files

    from app.services.agents import interview_scheduling
    from app.services.agents.interview_scheduling import create_workflow, app
"""

from . import shortlist
from . import interview_scheduling

__all__ = [
    "shortlist",
    "interview_scheduling",
]


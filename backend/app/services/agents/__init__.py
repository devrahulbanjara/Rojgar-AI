"""
Agents package - AI-powered automation services.

This module provides agent-based services for intelligent automation.
Import from here instead of individual submodules for a cleaner API.

Example:
    from app.services.agents import shortlist
    from app.services.agents.shortlist import create_workflow, discover_resume_files
"""

from . import shortlist

__all__ = [
    "shortlist",
]


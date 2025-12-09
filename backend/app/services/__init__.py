"""
Services package - Business logic layer.

This module provides service classes for handling business logic.
Import from here instead of individual submodules for a cleaner API.

Example:
    from app.services import AuthService, JobService, UserService
"""

# Auth service (shared - used by both candidates and recruiters)
from .auth.auth_service import AuthService

# Candidate services
from .candidate import (
    ApplicationService,
    JobService,
    ProfileService,
    ResumeService,
    SkillService,
    UserService,
    VectorJobService,
)

__all__ = [
    # Auth
    "AuthService",
    # Candidate services
    "ApplicationService",
    "JobService",
    "ProfileService",
    "ResumeService",
    "SkillService",
    "UserService",
    "VectorJobService",
]

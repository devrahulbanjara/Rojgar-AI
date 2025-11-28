"""
Services package - Business logic layer.

This module provides service classes for handling business logic.
Import from here instead of individual submodules for a cleaner API.

Example:
    from app.services import AuthService, JobService, UserService
"""

# Auth service
from .auth.auth_service import AuthService

# Core services
from .job_service import JobService
from .user_service import UserService
from .application_service import ApplicationService
from .profile_service import ProfileService
from .resume_service import ResumeService
from .skill_service import SkillService
from .vector_job_service import VectorJobService

__all__ = [
    "AuthService",
    "JobService",
    "UserService",
    "ApplicationService",
    "ProfileService",
    "ResumeService",
    "SkillService",
    "VectorJobService",
]

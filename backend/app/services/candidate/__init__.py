"""
Candidate services package - Business logic for candidate-focused features.

This module provides service classes for handling candidate-specific business logic
such as applications, profiles, skills, resumes, and job browsing.

Example:
    from app.services.candidate import ApplicationService, ProfileService
"""

from .application_service import ApplicationService
from .job_service import JobService
from .profile_service import ProfileService
from .resume import ResumeService
from .skill_service import SkillService
from .user_service import UserService
from .vector_job_service import VectorJobService

__all__ = [
    "ApplicationService",
    "JobService",
    "ProfileService",
    "ResumeService",
    "SkillService",
    "UserService",
    "VectorJobService",
]

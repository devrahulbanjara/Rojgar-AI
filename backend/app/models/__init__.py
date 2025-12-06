"""
Models package - SQLAlchemy ORM models.

This module provides database models for the application.
Import from here instead of individual submodules for a cleaner API.

Example:
    from app.models import User, Job, Application
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models"""

    pass


# User models
# Application models
from .application import Application, ApplicationStage, ApplicationStatus

# Job models
from .job import Company, EmploymentType, Job, JobLevel, JobStatus, LocationType

# Profile models
from .profile import (
    Certification,
    EducationRecord,
    Profile,
    ProfileSkill,
    WorkExperience,
)

# Resume models
from .resume import (
    Resume,
    ResumeCertification,
    ResumeEducation,
    ResumeExperience,
    ResumeSkill,
)

# Skill models
from .skill import Skill
from .user import User, UserRole

__all__ = [
    # Base
    "Base",
    # User
    "User",
    "UserRole",
    # Job
    "Job",
    "Company",
    "JobStatus",
    "JobLevel",
    "LocationType",
    "EmploymentType",
    # Application
    "Application",
    "ApplicationStage",
    "ApplicationStatus",
    # Skill
    "Skill",
    # Profile
    "Profile",
    "WorkExperience",
    "EducationRecord",
    "Certification",
    "ProfileSkill",
    # Resume
    "Resume",
    "ResumeExperience",
    "ResumeEducation",
    "ResumeCertification",
    "ResumeSkill",
]

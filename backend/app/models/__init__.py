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
from .user import User, UserRole

# Job models
from .job import Job, Company, JobStatus, JobLevel, LocationType, EmploymentType

# Application models
from .application import Application, ApplicationStage, ApplicationStatus

# Skill models
from .skill import Skill

# Profile models
from .profile import (
    Profile,
    WorkExperience,
    EducationRecord,
    Certification,
    ProfileSkill,
)

# Resume models
from .resume import (
    Resume,
    ResumeExperience,
    ResumeEducation,
    ResumeCertification,
    ResumeSkill,
)

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

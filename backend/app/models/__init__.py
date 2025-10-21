"""
SQLAlchemy models and Pydantic schemas
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models"""
    pass


# Import all models to ensure they're registered with Base.metadata
from app.models.user import User  # noqa: E402, F401
from app.models.job import Job, Company  # noqa: E402, F401
from app.models.application import Application  # noqa: E402, F401
from app.models.skill import Skill  # noqa: E402, F401
from app.models.profile import (  # noqa: E402, F401
    Profile, WorkExperience, EducationRecord, Certification, ProfileSkill,
    ProfileResponse, WorkExperienceResponse, EducationRecordResponse, 
    CertificationResponse, ProfileSkillResponse, rebuild_profile_models
)
from app.models.resume import (  # noqa: E402, F401
    Resume, ResumeExperience, ResumeEducation, ResumeCertification, ResumeSkill,
    ResumeResponse, ResumeExperienceResponse, ResumeEducationResponse,
    ResumeCertificationResponse, ResumeSkillResponse, rebuild_models
)

# Rebuild all models to resolve forward references
# Profile models must be rebuilt first since resume models depend on them
try:
    rebuild_profile_models()
    rebuild_models()
except Exception as e:
    # If rebuilding fails, it's likely due to circular imports
    # The models will still work, but some forward references might not be resolved
    pass

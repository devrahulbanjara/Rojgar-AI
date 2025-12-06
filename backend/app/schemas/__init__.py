"""
Schemas package - Pydantic models for API data contracts.

This module provides request/response schemas for the API.
Import from here instead of individual submodules for a cleaner API.

Example:
    from app.schemas import UserResponse, JobResponse, ApplicationCreate
"""

# User schemas
# Application schemas
from .application import (
    ApplicationResponse,
    CreateApplicationRequest,
    UpdateApplicationRequest,
)

# Job schemas
from .job import (
    CompanyResponse,
    JobResponse,
    JobSearchRequest,
)

# Profile schemas
from .profile import (
    CertificationCreateRequest,
    CertificationResponse,
    CertificationUpdateRequest,
    EducationCreateRequest,
    EducationRecordResponse,
    EducationUpdateRequest,
    ProfileCreateRequest,
    ProfileResponse,
    ProfileSkillResponse,
    ProfileUpdateRequest,
    WorkExperienceCreateRequest,
    WorkExperienceResponse,
    WorkExperienceUpdateRequest,
)
from .profile import (
    SkillCreateRequest as ProfileSkillCreateRequest,
)
from .profile import (
    SkillUpdateRequest as ProfileSkillUpdateRequest,
)

# Resume schemas
from .resume import (
    ResumeCertificationResponse,
    ResumeCreateRequest,
    ResumeEducationResponse,
    ResumeExperienceResponse,
    ResumeResponse,
    ResumeSkillResponse,
    ResumeUpdateRequest,
    rebuild_models,
)

# Skill schemas
from .skill import (
    SkillCreateRequest,
    SkillResponse,
    SkillsListResponse,
)
from .user import (
    CreateUserRequest,
    GoogleUserInfo,
    LoginRequest,
    RoleSelectionRequest,
    SignupRequest,
    TokenResponse,
    UserResponse,
)

# Rebuild models to resolve forward references
rebuild_models()

__all__ = [
    # User
    "UserResponse",
    "GoogleUserInfo",
    "CreateUserRequest",
    "SignupRequest",
    "LoginRequest",
    "RoleSelectionRequest",
    "TokenResponse",
    # Profile
    "ProfileResponse",
    "ProfileCreateRequest",
    "ProfileUpdateRequest",
    "WorkExperienceResponse",
    "WorkExperienceCreateRequest",
    "WorkExperienceUpdateRequest",
    "EducationRecordResponse",
    "EducationCreateRequest",
    "EducationUpdateRequest",
    "CertificationResponse",
    "CertificationCreateRequest",
    "CertificationUpdateRequest",
    "ProfileSkillResponse",
    "ProfileSkillCreateRequest",
    "ProfileSkillUpdateRequest",
    # Job
    "JobResponse",
    "CompanyResponse",
    "JobSearchRequest",
    # Resume
    "ResumeResponse",
    "ResumeCreateRequest",
    "ResumeUpdateRequest",
    "ResumeExperienceResponse",
    "ResumeEducationResponse",
    "ResumeCertificationResponse",
    "ResumeSkillResponse",
    "rebuild_models",
    # Application
    "ApplicationResponse",
    "CreateApplicationRequest",
    "UpdateApplicationRequest",
    # Skill
    "SkillResponse",
    "SkillCreateRequest",
    "SkillsListResponse",
]

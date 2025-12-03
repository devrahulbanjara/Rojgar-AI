"""
Schemas package - Pydantic models for API data contracts.

This module provides request/response schemas for the API.
Import from here instead of individual submodules for a cleaner API.

Example:
    from app.schemas import UserResponse, JobResponse, ApplicationCreate
"""

# User schemas
from .user import (
    UserResponse,
    GoogleUserInfo,
    CreateUserRequest,
    SignupRequest,
    LoginRequest,
    RoleSelectionRequest,
    TokenResponse,
)

# Profile schemas
from .profile import (
    ProfileResponse,
    ProfileCreateRequest,
    ProfileUpdateRequest,
    WorkExperienceResponse,
    WorkExperienceCreateRequest,
    WorkExperienceUpdateRequest,
    EducationRecordResponse,
    EducationCreateRequest,
    EducationUpdateRequest,
    CertificationResponse,
    CertificationCreateRequest,
    CertificationUpdateRequest,
    ProfileSkillResponse,
    SkillCreateRequest as ProfileSkillCreateRequest,
    SkillUpdateRequest as ProfileSkillUpdateRequest,
)

# Job schemas
from .job import (
    JobResponse,
    CompanyResponse,
    JobSearchRequest,
)

# Resume schemas
from .resume import (
    ResumeResponse,
    ResumeCreateRequest,
    ResumeUpdateRequest,
    ResumeExperienceResponse,
    ResumeEducationResponse,
    ResumeCertificationResponse,
    ResumeSkillResponse,
    rebuild_models,
)

# Application schemas
from .application import (
    ApplicationResponse,
    CreateApplicationRequest,
    UpdateApplicationRequest,
)

# Skill schemas
from .skill import (
    SkillResponse,
    SkillCreateRequest,
    SkillsListResponse,
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

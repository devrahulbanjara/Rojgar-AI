from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.shared import (
    CertificationBase,
    EducationBase,
    SkillBase,
    SocialLinkBase,
    WorkExperienceBase,
)


# --- SYNC SCHEMAS (items with optional IDs for create-or-update) ---
class ResumeWorkExperienceSync(WorkExperienceBase):
    resume_work_experience_id: UUID | None = None


class ResumeEducationSync(EducationBase):
    resume_education_id: UUID | None = None


class ResumeCertificationSync(CertificationBase):
    resume_certification_id: UUID | None = None


class ResumeSkillSync(SkillBase):
    resume_skill_id: UUID | None = None


class ResumeSocialLinkSync(SocialLinkBase):
    resume_social_link_id: UUID | None = None


# --- CREATE ---
class ResumeCreate(BaseModel):
    target_job_title: Annotated[str | None, "Target job title"] = None
    custom_summary: Annotated[str | None, "Custom resume summary"] = None
    work_experiences: Annotated[
        list[WorkExperienceBase] | None, "Work experience entries"
    ] = None
    educations: Annotated[list[EducationBase] | None, "Education entries"] = None
    certifications: Annotated[
        list[CertificationBase] | None, "Certification entries"
    ] = None
    skills: Annotated[list[SkillBase] | None, "Skill entries"] = None
    social_links: Annotated[list[SocialLinkBase] | None, "Social profile links"] = None


# --- UPDATE (State Sync) ---
class ResumeUpdate(BaseModel):
    target_job_title: Annotated[str | None, "Target job title"] = None
    custom_summary: Annotated[str | None, "Custom resume summary"] = None
    is_default: Annotated[bool | None, "Set as default resume"] = None

    # Nested Collections for State Sync
    work_experiences: list[ResumeWorkExperienceSync] | None = None
    educations: list[ResumeEducationSync] | None = None
    certifications: list[ResumeCertificationSync] | None = None
    skills: list[ResumeSkillSync] | None = None
    social_links: list[ResumeSocialLinkSync] | None = None


# --- RESPONSE SCHEMAS ---
class ResumeSocialLinkResponse(SocialLinkBase):
    resume_social_link_id: UUID
    model_config = ConfigDict(from_attributes=True)


class ResumeWorkExperienceResponse(WorkExperienceBase):
    resume_work_experience_id: UUID
    model_config = ConfigDict(from_attributes=True)


class ResumeEducationResponse(EducationBase):
    resume_education_id: UUID
    model_config = ConfigDict(from_attributes=True)


class ResumeCertificationResponse(CertificationBase):
    resume_certification_id: UUID
    model_config = ConfigDict(from_attributes=True)


class ResumeSkillResponse(SkillBase):
    resume_skill_id: UUID
    model_config = ConfigDict(from_attributes=True)


class ResumeResponse(BaseModel):
    resume_id: UUID
    profile_id: UUID
    target_job_title: Annotated[str | None, "Target job title"] = None
    custom_summary: Annotated[str | None, "Custom resume summary"] = None
    is_default: Annotated[bool, "Whether this is the default resume"] = False
    created_at: Annotated[datetime, Field(description="Resume creation timestamp")]
    updated_at: Annotated[datetime, Field(description="Resume last update timestamp")]
    social_links: Annotated[list[ResumeSocialLinkResponse], "Social links"] = []
    work_experiences: Annotated[
        list[ResumeWorkExperienceResponse], "Work experiences"
    ] = []
    educations: Annotated[list[ResumeEducationResponse], "Education entries"] = []
    certifications: Annotated[
        list[ResumeCertificationResponse], "Certification entries"
    ] = []
    skills: Annotated[list[ResumeSkillResponse], "Skill entries"] = []
    model_config = ConfigDict(from_attributes=True)


class ResumeListResponse(BaseModel):
    resume_id: UUID
    target_job_title: Annotated[str | None, "Target job title"] = None
    is_default: Annotated[bool, "Whether this is the default resume"] = False
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

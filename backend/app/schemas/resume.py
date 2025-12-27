from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.shared import (
    CertificationBase,
    EducationBase,
    SkillBase,
    SocialLinkBase,
    WorkExperienceBase,
)

# --- Inputs ---


class ResumeCreate(BaseModel):
    resume_name: str
    target_job_title: str | None = None
    custom_summary: str | None = None

    # Optional Custom Data (if provided, overrides profile fetch)
    work_experiences: list[WorkExperienceBase] | None = None
    educations: list[EducationBase] | None = None
    certifications: list[CertificationBase] | None = None
    skills: list[SkillBase] | None = None
    social_links: list[SocialLinkBase] | None = None


class ResumeUpdate(BaseModel):
    resume_name: str | None = None
    target_job_title: str | None = None
    custom_summary: str | None = None


class ResumeWorkExperienceUpdate(BaseModel):
    job_title: str | None = None
    company: str | None = None
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool | None = None
    description: str | None = None


class ResumeEducationUpdate(BaseModel):
    college_name: str | None = None
    degree: str | None = None
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool | None = None


class ResumeSkillUpdate(BaseModel):
    skill_name: str | None = None


class ResumeCertificationUpdate(BaseModel):
    certification_name: str | None = None
    issuing_body: str | None = None
    credential_url: str | None = None
    issue_date: date | None = None
    expiration_date: date | None = None
    does_not_expire: bool | None = None


class ResumeSocialLinkResponse(SocialLinkBase):
    resume_social_link_id: str
    model_config = ConfigDict(from_attributes=True)


class ResumeWorkExperienceResponse(WorkExperienceBase):
    resume_work_experience_id: str
    model_config = ConfigDict(from_attributes=True)


class ResumeEducationResponse(EducationBase):
    resume_education_id: str
    model_config = ConfigDict(from_attributes=True)


class ResumeCertificationResponse(CertificationBase):
    resume_certification_id: str
    model_config = ConfigDict(from_attributes=True)


class ResumeSkillResponse(SkillBase):
    resume_skill_id: str
    model_config = ConfigDict(from_attributes=True)


class ResumeResponse(BaseModel):
    resume_id: str
    profile_id: str
    resume_name: str
    target_job_title: str | None = None
    custom_summary: str | None = None
    created_at: datetime
    updated_at: datetime

    # Nested Lists
    social_links: list[ResumeSocialLinkResponse] = []
    work_experiences: list[ResumeWorkExperienceResponse] = []
    educations: list[ResumeEducationResponse] = []
    certifications: list[ResumeCertificationResponse] = []
    skills: list[ResumeSkillResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ResumeListResponse(BaseModel):
    """Lightweight response for list view"""

    resume_id: str
    resume_name: str
    target_job_title: str | None = None
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

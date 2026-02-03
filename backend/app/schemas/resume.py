from datetime import date, datetime
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


class ResumeUpdate(BaseModel):
    target_job_title: Annotated[str | None, "Target job title"] = None
    custom_summary: Annotated[str | None, "Custom resume summary"] = None


class ResumeWorkExperienceUpdate(BaseModel):
    job_title: Annotated[str | None, "Job title"] = None
    company: Annotated[str | None, "Company name"] = None
    location: Annotated[str | None, "Job location"] = None
    start_date: Annotated[date | None, "Employment start date"] = None
    end_date: Annotated[date | None, "Employment end date"] = None
    is_current: Annotated[bool | None, "Whether this is the current role"] = None
    description: Annotated[str | None, "Role description"] = None


class ResumeEducationUpdate(BaseModel):
    college_name: Annotated[str | None, "College or university name"] = None
    degree: Annotated[str | None, "Degree or program name"] = None
    location: Annotated[str | None, "Education location"] = None
    start_date: Annotated[date | None, "Education start date"] = None
    end_date: Annotated[date | None, "Education end date"] = None
    is_current: Annotated[bool | None, "Whether this education is ongoing"] = None


class ResumeSkillUpdate(BaseModel):
    skill_name: Annotated[str | None, "Skill name"] = None


class ResumeCertificationUpdate(BaseModel):
    certification_name: Annotated[str | None, "Certification name"] = None
    issuing_body: Annotated[str | None, "Issuing organization"] = None
    credential_url: Annotated[str | None, "Credential verification URL"] = None
    issue_date: Annotated[date | None, "Certification issue date"] = None
    expiration_date: Annotated[date | None, "Certification expiration date"] = None
    does_not_expire: Annotated[
        bool | None, "Whether the certification does not expire"
    ] = None


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
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

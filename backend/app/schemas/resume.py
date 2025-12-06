from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from .profile import (
    CertificationResponse,
    EducationRecordResponse,
    ProfileSkillResponse,
    WorkExperienceResponse,
)


class ResumeCreateRequest(BaseModel):
    name: str
    contact_full_name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    contact_location: str | None = None
    custom_summary: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None


class ResumeUpdateRequest(BaseModel):
    name: str | None = None
    contact_full_name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    contact_location: str | None = None
    custom_summary: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None


class AddExperienceToResumeRequest(BaseModel):
    work_experience_id: str
    custom_description: str


class UpdateExperienceInResumeRequest(BaseModel):
    custom_description: str | None = None
    job_title: str | None = None
    company: str | None = None
    location: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    is_current: bool | None = None
    master_description: str | None = None


class AddEducationToResumeRequest(BaseModel):
    education_record_id: str


class AddCertificationToResumeRequest(BaseModel):
    certification_id: str


class AddSkillToResumeRequest(BaseModel):
    profile_skill_id: str


class CreateResumeExperienceRequest(BaseModel):
    job_title: str
    company: str
    location: str | None = None
    start_date: str
    end_date: str | None = None
    is_current: bool = False
    master_description: str


class CreateResumeEducationRequest(BaseModel):
    school_university: str
    degree: str
    field_of_study: str
    location: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    is_current: bool = False
    gpa: str | None = None
    honors: str | None = None


class CreateResumeCertificationRequest(BaseModel):
    name: str
    issuing_body: str
    credential_id: str | None = None
    credential_url: str | None = None
    issue_date: str | None = None
    expiration_date: str | None = None
    does_not_expire: bool = False


class CreateResumeSkillRequest(BaseModel):
    skill_name: str
    proficiency_level: str = "Intermediate"
    years_of_experience: int | None = None


class UpdateEducationInResumeRequest(BaseModel):
    school_university: str | None = None
    degree: str | None = None
    field_of_study: str | None = None
    location: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    is_current: bool | None = None
    gpa: str | None = None
    honors: str | None = None


class UpdateCertificationInResumeRequest(BaseModel):
    name: str | None = None
    issuing_body: str | None = None
    credential_id: str | None = None
    credential_url: str | None = None
    issue_date: str | None = None
    expiration_date: str | None = None
    does_not_expire: bool | None = None


class UpdateSkillInResumeRequest(BaseModel):
    skill_name: str | None = None
    proficiency_level: str | None = None
    years_of_experience: int | None = None


class ResumeAutofillData(BaseModel):
    contact_full_name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    contact_location: str | None = None
    professional_summary: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None
    work_experiences: list[dict] = []
    education_records: list[dict] = []
    certifications: list[dict] = []
    skills: list[dict] = []


class ResumeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    profile_id: str
    name: str
    target_job_title: str | None = None
    contact_full_name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    contact_location: str | None = None
    custom_summary: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None
    created_at: datetime
    updated_at: datetime

    experiences: list["ResumeExperienceResponse"] = []
    educations: list["ResumeEducationResponse"] = []
    certifications: list["ResumeCertificationResponse"] = []
    skills: list["ResumeSkillResponse"] = []


class ResumeExperienceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    resume_id: str
    work_experience_id: str
    custom_description: str
    display_order: int
    created_at: datetime
    updated_at: datetime

    job_title: str | None = None
    company: str | None = None
    location: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    is_current: bool | None = None
    master_description: str | None = None

    work_experience: Optional["WorkExperienceResponse"] = None


class ResumeEducationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    resume_id: str
    education_record_id: str
    display_order: int
    created_at: datetime
    updated_at: datetime

    school_university: str | None = None
    degree: str | None = None
    field_of_study: str | None = None
    location: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    is_current: bool | None = None
    gpa: str | None = None
    honors: str | None = None

    education_record: Optional["EducationRecordResponse"] = None


class ResumeCertificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    resume_id: str
    certification_id: str
    display_order: int
    created_at: datetime
    updated_at: datetime

    name: str | None = None
    issuing_body: str | None = None
    credential_id: str | None = None
    credential_url: str | None = None
    issue_date: datetime | None = None
    expiration_date: datetime | None = None
    does_not_expire: bool | None = None

    certification: Optional["CertificationResponse"] = None


class ResumeSkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    resume_id: str
    profile_skill_id: str
    display_order: int
    created_at: datetime
    updated_at: datetime

    skill_name: str | None = None
    proficiency_level: str | None = None
    years_of_experience: int | None = None

    profile_skill: Optional["ProfileSkillResponse"] = None


def rebuild_models():
    ResumeResponse.model_rebuild()
    ResumeExperienceResponse.model_rebuild()
    ResumeEducationResponse.model_rebuild()
    ResumeCertificationResponse.model_rebuild()
    ResumeSkillResponse.model_rebuild()

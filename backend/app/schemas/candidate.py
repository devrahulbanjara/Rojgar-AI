from datetime import date

from pydantic import BaseModel, ConfigDict

from app.schemas.shared import (
    CertificationBase,
    EducationBase,
    SkillBase,
    SocialLinkBase,
    WorkExperienceBase,
)


# --- Inputs ---
class CandidateProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    location_city: str | None = None
    location_country: str | None = None
    professional_headline: str | None = None
    professional_summary: str | None = None


class CertificationUpdate(BaseModel):
    certification_name: str | None = None
    issuing_body: str | None = None
    credential_id: str | None = None
    credential_url: str | None = None
    issue_date: date | None = None
    expiration_date: date | None = None
    does_not_expire: bool | None = None


class SkillUpdate(BaseModel):
    skill_name: str | None = None


class WorkExperienceUpdate(BaseModel):
    job_title: str | None = None
    company: str | None = None
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool | None = None
    description: str | None = None


class EducationUpdate(BaseModel):
    college_name: str | None = None
    degree: str | None = None
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool | None = None


# --- Responses ---
class SocialLinkResponse(SocialLinkBase):
    social_link_id: str
    model_config = ConfigDict(from_attributes=True)


class WorkExperienceResponse(WorkExperienceBase):
    candidate_work_experience_id: str
    model_config = ConfigDict(from_attributes=True)


class EducationResponse(EducationBase):
    candidate_education_id: str
    model_config = ConfigDict(from_attributes=True)


class CertificationResponse(CertificationBase):
    candidate_certification_id: str
    model_config = ConfigDict(from_attributes=True)


class SkillResponse(SkillBase):
    candidate_skill_id: str
    model_config = ConfigDict(from_attributes=True)


class CandidateProfileFullResponse(BaseModel):
    profile_id: str
    user_id: str
    full_name: str
    email: str
    picture: str | None = None
    phone: str | None = None
    location_city: str | None = None
    location_country: str | None = None
    professional_headline: str | None = None
    professional_summary: str | None = None

    social_links: list[SocialLinkResponse] = []
    work_experiences: list[WorkExperienceResponse] = []
    educations: list[EducationResponse] = []
    certifications: list[CertificationResponse] = []
    skills: list[SkillResponse] = []

    model_config = ConfigDict(from_attributes=True)

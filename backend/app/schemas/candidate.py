from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

from app.schemas.shared import (
    CertificationBase,
    EducationBase,
    SkillBase,
    SocialLinkBase,
    WorkExperienceBase,
)


# --- Sync Schemas (extend Base with optional ID for state synchronization) ---
class WorkExperienceSync(WorkExperienceBase):
    candidate_work_experience_id: UUID | None = None


class EducationSync(EducationBase):
    candidate_education_id: UUID | None = None


class CertificationSync(CertificationBase):
    candidate_certification_id: UUID | None = None


class SkillSync(SkillBase):
    candidate_skill_id: UUID | None = None


class SocialLinkSync(SocialLinkBase):
    social_link_id: UUID | None = None


# --- Profile Update Schema (accepts nested collections for state sync) ---
class CandidateProfileUpdate(BaseModel):
    full_name: Annotated[str | None, "Candidate full name"] = None
    phone: Annotated[str | None, "Phone number"] = None
    location_city: Annotated[str | None, "City of residence"] = None
    location_country: Annotated[str | None, "Country of residence"] = None
    professional_headline: Annotated[str | None, "Professional headline/title"] = None
    professional_summary: Annotated[str | None, "Professional summary/about"] = None

    # Nested collections for state synchronization
    work_experiences: list[WorkExperienceSync] | None = None
    educations: list[EducationSync] | None = None
    certifications: list[CertificationSync] | None = None
    skills: list[SkillSync] | None = None
    social_links: list[SocialLinkSync] | None = None


# --- Response Schemas ---
class SocialLinkResponse(SocialLinkBase):
    social_link_id: UUID
    model_config = ConfigDict(from_attributes=True)


class WorkExperienceResponse(WorkExperienceBase):
    candidate_work_experience_id: UUID
    model_config = ConfigDict(from_attributes=True)


class EducationResponse(EducationBase):
    candidate_education_id: UUID
    model_config = ConfigDict(from_attributes=True)


class CertificationResponse(CertificationBase):
    candidate_certification_id: UUID
    model_config = ConfigDict(from_attributes=True)


class SkillResponse(SkillBase):
    candidate_skill_id: UUID
    model_config = ConfigDict(from_attributes=True)


class CandidateProfileFullResponse(BaseModel):
    profile_id: UUID
    user_id: UUID
    full_name: Annotated[str, "Candidate full name"]
    email: EmailStr
    picture: Annotated[str | None, "Profile picture URL"] = None
    phone: Annotated[str | None, "Phone number"] = None
    location_city: Annotated[str | None, "City of residence"] = None
    location_country: Annotated[str | None, "Country of residence"] = None
    professional_headline: Annotated[str | None, "Professional headline/title"] = None
    professional_summary: Annotated[str | None, "Professional summary/about"] = None
    social_links: Annotated[list[SocialLinkResponse], "Candidate social links"] = []
    work_experiences: Annotated[
        list[WorkExperienceResponse], "Candidate work experiences"
    ] = []
    educations: Annotated[list[EducationResponse], "Candidate education entries"] = []
    certifications: Annotated[
        list[CertificationResponse], "Candidate certifications"
    ] = []
    skills: Annotated[list[SkillResponse], "Candidate skills"] = []
    model_config = ConfigDict(from_attributes=True)

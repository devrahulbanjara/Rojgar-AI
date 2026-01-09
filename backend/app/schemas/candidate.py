from datetime import date
from typing import Annotated

from pydantic import BaseModel, ConfigDict

from app.schemas.shared import (
    CertificationBase,
    EducationBase,
    SkillBase,
    SocialLinkBase,
    WorkExperienceBase,
)


class CandidateProfileUpdate(BaseModel):
    full_name: Annotated[str | None, "Candidate full name"] = None
    phone: Annotated[str | None, "Phone number"] = None
    location_city: Annotated[str | None, "City of residence"] = None
    location_country: Annotated[str | None, "Country of residence"] = None
    professional_headline: Annotated[str | None, "Professional headline/title"] = None
    professional_summary: Annotated[str | None, "Professional summary/about"] = None


class CertificationUpdate(BaseModel):
    certification_name: Annotated[str | None, "Certification name"] = None
    issuing_body: Annotated[str | None, "Issuing organization"] = None
    credential_id: Annotated[str | None, "Credential ID"] = None
    credential_url: Annotated[str | None, "Credential verification URL"] = None
    issue_date: Annotated[date | None, "Date issued"] = None
    expiration_date: Annotated[date | None, "Expiration date"] = None
    does_not_expire: Annotated[bool | None, "Whether certification does not expire"] = (
        None
    )


class SkillUpdate(BaseModel):
    skill_name: Annotated[str | None, "Skill name"] = None


class WorkExperienceUpdate(BaseModel):
    job_title: Annotated[str | None, "Job title"] = None
    company: Annotated[str | None, "Company name"] = None
    location: Annotated[str | None, "Job location"] = None
    start_date: Annotated[date | None, "Start date"] = None
    end_date: Annotated[date | None, "End date"] = None
    is_current: Annotated[bool | None, "Whether this is the current role"] = None
    description: Annotated[str | None, "Role description"] = None


class EducationUpdate(BaseModel):
    college_name: Annotated[str | None, "College/university name"] = None
    degree: Annotated[str | None, "Degree or program"] = None
    location: Annotated[str | None, "Education location"] = None
    start_date: Annotated[date | None, "Start date"] = None
    end_date: Annotated[date | None, "End date"] = None
    is_current: Annotated[bool | None, "Whether this education is ongoing"] = None


class SocialLinkResponse(SocialLinkBase):
    social_link_id: Annotated[str, "Social link ID"]
    model_config = ConfigDict(from_attributes=True)


class WorkExperienceResponse(WorkExperienceBase):
    candidate_work_experience_id: Annotated[str, "Candidate work experience ID"]
    model_config = ConfigDict(from_attributes=True)


class EducationResponse(EducationBase):
    candidate_education_id: Annotated[str, "Candidate education ID"]
    model_config = ConfigDict(from_attributes=True)


class CertificationResponse(CertificationBase):
    candidate_certification_id: Annotated[str, "Candidate certification ID"]
    model_config = ConfigDict(from_attributes=True)


class SkillResponse(SkillBase):
    candidate_skill_id: Annotated[str, "Candidate skill ID"]
    model_config = ConfigDict(from_attributes=True)


class CandidateProfileFullResponse(BaseModel):
    profile_id: Annotated[str, "Candidate profile ID"]
    user_id: Annotated[str, "Associated user ID"]
    full_name: Annotated[str, "Candidate full name"]
    email: Annotated[str, "Candidate email"]
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

from datetime import date
from typing import Annotated

from pydantic import BaseModel


class SocialLinkBase(BaseModel):
    type: Annotated[str, "Type of social platform"]
    url: Annotated[str, "Social profile URL"]


class WorkExperienceBase(BaseModel):
    job_title: Annotated[str, "Job title"]
    company: Annotated[str, "Company name"]
    location: Annotated[str | None, "Job location"] = None
    start_date: Annotated[date | None, "Employment start date"] = None
    end_date: Annotated[date | None, "Employment end date"] = None
    is_current: Annotated[bool, "Whether this is the current role"] = False
    description: Annotated[str | None, "Role description"] = None


class EducationBase(BaseModel):
    college_name: Annotated[str, "College or university name"]
    degree: Annotated[str, "Degree or program name"]
    location: Annotated[str | None, "Education location"] = None
    start_date: Annotated[date | None, "Education start date"] = None
    end_date: Annotated[date | None, "Education end date"] = None
    is_current: Annotated[bool, "Whether this education is ongoing"] = False


class CertificationBase(BaseModel):
    certification_name: Annotated[str, "Certification name"]
    issuing_body: Annotated[str, "Issuing organization"]
    credential_id: Annotated[str | None, "Credential ID"] = None
    credential_url: Annotated[str | None, "Credential verification URL"] = None
    issue_date: Annotated[date | None, "Certification issue date"] = None
    expiration_date: Annotated[date | None, "Certification expiration date"] = None
    does_not_expire: Annotated[bool, "Whether the certification does not expire"] = (
        False
    )


class SkillBase(BaseModel):
    skill_name: Annotated[str, "Skill name"]

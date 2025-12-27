from datetime import date

from pydantic import BaseModel

# --- Base Models used by both Profile and Resume ---


class SocialLinkBase(BaseModel):
    type: str
    url: str


class WorkExperienceBase(BaseModel):
    job_title: str
    company: str
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool = False
    description: str | None = None


class EducationBase(BaseModel):
    college_name: str
    degree: str
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool = False


class CertificationBase(BaseModel):
    certification_name: str
    issuing_body: str
    credential_id: str | None = None
    credential_url: str | None = None
    issue_date: date | None = None
    expiration_date: date | None = None
    does_not_expire: bool = False


class SkillBase(BaseModel):
    skill_name: str

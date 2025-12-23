from typing import Optional
from datetime import date
from pydantic import BaseModel

# --- Base Models used by both Profile and Resume ---

class SocialLinkBase(BaseModel):
    type: str
    url: str

class WorkExperienceBase(BaseModel):
    job_title: str
    company: str
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False
    description: Optional[str] = None

class EducationBase(BaseModel):
    college_name: str
    degree: str
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False

class CertificationBase(BaseModel):
    certification_name: str
    issuing_body: str
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    issue_date: Optional[date] = None
    expiration_date: Optional[date] = None
    does_not_expire: bool = False

class SkillBase(BaseModel):
    skill_name: str

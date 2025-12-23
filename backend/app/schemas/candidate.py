from typing import List, Optional
from datetime import date
from pydantic import BaseModel, ConfigDict
from app.schemas.shared import (
    SocialLinkBase, WorkExperienceBase, EducationBase, 
    CertificationBase, SkillBase
)

# --- Inputs ---
class CandidateProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    professional_headline: Optional[str] = None
    professional_summary: Optional[str] = None

class CertificationUpdate(BaseModel):
    certification_name: Optional[str] = None
    issuing_body: Optional[str] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    issue_date: Optional[date] = None
    expiration_date: Optional[date] = None
    does_not_expire: Optional[bool] = None

class SkillUpdate(BaseModel):
    skill_name: Optional[str] = None

class WorkExperienceUpdate(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None
    description: Optional[str] = None

class EducationUpdate(BaseModel):
    college_name: Optional[str] = None
    degree: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None

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
    picture: Optional[str] = None
    phone: Optional[str] = None
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    professional_headline: Optional[str] = None
    professional_summary: Optional[str] = None
    
    social_links: List[SocialLinkResponse] = []
    work_experiences: List[WorkExperienceResponse] = []
    educations: List[EducationResponse] = []
    certifications: List[CertificationResponse] = []
    skills: List[SkillResponse] = []

    model_config = ConfigDict(from_attributes=True)

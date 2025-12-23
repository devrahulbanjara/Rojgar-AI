from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel, ConfigDict
from app.schemas.shared import (
    SocialLinkBase, WorkExperienceBase, EducationBase, 
    CertificationBase, SkillBase
)

# --- Inputs ---

class ResumeCreate(BaseModel):
    resume_name: str
    target_job_title: Optional[str] = None
    custom_summary: Optional[str] = None
    
    # Optional Custom Data (if provided, overrides profile fetch)
    work_experiences: Optional[List[WorkExperienceBase]] = None
    educations: Optional[List[EducationBase]] = None
    certifications: Optional[List[CertificationBase]] = None
    skills: Optional[List[SkillBase]] = None
    social_links: Optional[List[SocialLinkBase]] = None

class ResumeUpdate(BaseModel):
    resume_name: Optional[str] = None
    target_job_title: Optional[str] = None
    custom_summary: Optional[str] = None

class ResumeWorkExperienceUpdate(BaseModel):

    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None
    description: Optional[str] = None

class ResumeEducationUpdate(BaseModel):
    college_name: Optional[str] = None
    degree: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None

class ResumeSkillUpdate(BaseModel):
    skill_name: Optional[str] = None

class ResumeCertificationUpdate(BaseModel):
    certification_name: Optional[str] = None
    issuing_body: Optional[str] = None
    credential_url: Optional[str] = None
    issue_date: Optional[date] = None
    expiration_date: Optional[date] = None
    does_not_expire: Optional[bool] = None

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
    target_job_title: Optional[str] = None
    custom_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Nested Lists
    social_links: List[ResumeSocialLinkResponse] = []
    work_experiences: List[ResumeWorkExperienceResponse] = []
    educations: List[ResumeEducationResponse] = []
    certifications: List[ResumeCertificationResponse] = []
    skills: List[ResumeSkillResponse] = []

    model_config = ConfigDict(from_attributes=True)

class ResumeListResponse(BaseModel):
    """Lightweight response for list view"""
    resume_id: str
    resume_name: str
    target_job_title: Optional[str] = None
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

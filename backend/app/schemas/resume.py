"""
Resume schemas - Pydantic models for resume API data contracts
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

# Import response models from profile schema
from .profile import (
    WorkExperienceResponse, EducationRecordResponse, 
    CertificationResponse, ProfileSkillResponse
)


class ResumeCreateRequest(BaseModel):
    name: str
    contact_full_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_location: Optional[str] = None
    custom_summary: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None


class ResumeUpdateRequest(BaseModel):
    name: Optional[str] = None
    contact_full_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_location: Optional[str] = None
    custom_summary: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None


class AddExperienceToResumeRequest(BaseModel):
    work_experience_id: str
    custom_description: str


class UpdateExperienceInResumeRequest(BaseModel):
    custom_description: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: Optional[bool] = None
    master_description: Optional[str] = None


class AddEducationToResumeRequest(BaseModel):
    education_record_id: str


class AddCertificationToResumeRequest(BaseModel):
    certification_id: str


class AddSkillToResumeRequest(BaseModel):
    profile_skill_id: str


# Resume-specific section creation requests (don't affect profile)
class CreateResumeExperienceRequest(BaseModel):
    job_title: str
    company: str
    location: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    is_current: bool = False
    master_description: str


class CreateResumeEducationRequest(BaseModel):
    school_university: str
    degree: str
    field_of_study: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    gpa: Optional[str] = None
    honors: Optional[str] = None


class CreateResumeCertificationRequest(BaseModel):
    name: str
    issuing_body: str
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    issue_date: Optional[str] = None
    expiration_date: Optional[str] = None
    does_not_expire: bool = False


class CreateResumeSkillRequest(BaseModel):
    skill_name: str
    proficiency_level: str = "Intermediate"
    years_of_experience: Optional[int] = None


class UpdateEducationInResumeRequest(BaseModel):
    """Update education record in resume"""
    school_university: Optional[str] = None
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: Optional[bool] = None
    gpa: Optional[str] = None
    honors: Optional[str] = None


class UpdateCertificationInResumeRequest(BaseModel):
    """Update certification in resume"""
    name: Optional[str] = None
    issuing_body: Optional[str] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    issue_date: Optional[str] = None
    expiration_date: Optional[str] = None
    does_not_expire: Optional[bool] = None


class UpdateSkillInResumeRequest(BaseModel):
    """Update skill in resume"""
    skill_name: Optional[str] = None
    proficiency_level: Optional[str] = None
    years_of_experience: Optional[int] = None


class ResumeAutofillData(BaseModel):
    """Profile data for resume autofill"""
    contact_full_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_location: Optional[str] = None
    professional_summary: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    work_experiences: List[dict] = []
    education_records: List[dict] = []
    certifications: List[dict] = []
    skills: List[dict] = []


# ============= Response Schemas =============

class ResumeResponse(BaseModel):
    """Complete resume response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    profile_id: str
    name: str
    target_job_title: Optional[str] = None
    contact_full_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_location: Optional[str] = None
    custom_summary: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Nested data
    experiences: List["ResumeExperienceResponse"] = []
    educations: List["ResumeEducationResponse"] = []
    certifications: List["ResumeCertificationResponse"] = []
    skills: List["ResumeSkillResponse"] = []


class ResumeExperienceResponse(BaseModel):
    """Resume experience response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    resume_id: str
    work_experience_id: str
    custom_description: str
    display_order: int
    created_at: datetime
    updated_at: datetime
    
    # Resume-specific overrides
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_current: Optional[bool] = None
    master_description: Optional[str] = None
    
    # Include the original work experience data
    work_experience: Optional["WorkExperienceResponse"] = None


class ResumeEducationResponse(BaseModel):
    """Resume education response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    resume_id: str
    education_record_id: str
    display_order: int
    created_at: datetime
    updated_at: datetime
    
    # Resume-specific overrides
    school_university: Optional[str] = None
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_current: Optional[bool] = None
    gpa: Optional[str] = None
    honors: Optional[str] = None
    
    # Include the original education record data
    education_record: Optional["EducationRecordResponse"] = None


class ResumeCertificationResponse(BaseModel):
    """Resume certification response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    resume_id: str
    certification_id: str
    display_order: int
    created_at: datetime
    updated_at: datetime
    
    # Resume-specific overrides
    name: Optional[str] = None
    issuing_body: Optional[str] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    issue_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    does_not_expire: Optional[bool] = None
    
    # Include the original certification data
    certification: Optional["CertificationResponse"] = None


class ResumeSkillResponse(BaseModel):
    """Resume skill response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    resume_id: str
    profile_skill_id: str
    display_order: int
    created_at: datetime
    updated_at: datetime
    
    # Resume-specific overrides
    skill_name: Optional[str] = None
    proficiency_level: Optional[str] = None
    years_of_experience: Optional[int] = None
    
    # Include the original profile skill data
    profile_skill: Optional["ProfileSkillResponse"] = None


# Update forward references - these will be rebuilt when all models are loaded
def rebuild_models():
    """Rebuild all models to resolve forward references"""
    ResumeResponse.model_rebuild()
    ResumeExperienceResponse.model_rebuild()
    ResumeEducationResponse.model_rebuild()
    ResumeCertificationResponse.model_rebuild()
    ResumeSkillResponse.model_rebuild()

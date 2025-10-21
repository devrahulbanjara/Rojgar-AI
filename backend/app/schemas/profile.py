"""
Profile schemas - Pydantic models for profile API data contracts
"""

from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, ConfigDict


class ProfileCreateRequest(BaseModel):
    # User table fields (will update user table)
    name: Optional[str] = None
    email: Optional[str] = None
    picture: Optional[str] = None
    
    # Profile table fields (will update profile table)
    phone: Optional[str] = None
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    professional_headline: Optional[str] = None
    professional_summary: Optional[str] = None


class ProfileUpdateRequest(BaseModel):
    # User table fields (will update user table)
    name: Optional[str] = None
    email: Optional[str] = None
    picture: Optional[str] = None
    
    # Profile table fields (will update profile table)
    phone: Optional[str] = None
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    professional_headline: Optional[str] = None
    professional_summary: Optional[str] = None


class WorkExperienceCreateRequest(BaseModel):
    job_title: str
    company: str
    location: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    is_current: bool = False
    master_description: str


class WorkExperienceUpdateRequest(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None
    master_description: Optional[str] = None


class EducationCreateRequest(BaseModel):
    school_university: str
    degree: str
    field_of_study: str
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False
    gpa: Optional[str] = None
    honors: Optional[str] = None


class EducationUpdateRequest(BaseModel):
    school_university: Optional[str] = None
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None
    gpa: Optional[str] = None
    honors: Optional[str] = None


class CertificationCreateRequest(BaseModel):
    name: str
    issuing_body: str
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    issue_date: Optional[date] = None
    expiration_date: Optional[date] = None
    does_not_expire: bool = False


class CertificationUpdateRequest(BaseModel):
    name: Optional[str] = None
    issuing_body: Optional[str] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    issue_date: Optional[date] = None
    expiration_date: Optional[date] = None
    does_not_expire: Optional[bool] = None


class SkillCreateRequest(BaseModel):
    skill_name: str
    proficiency_level: str = "Intermediate"
    years_of_experience: Optional[int] = None


class SkillUpdateRequest(BaseModel):
    skill_name: Optional[str] = None
    proficiency_level: Optional[str] = None
    years_of_experience: Optional[int] = None


# ============= Response Schemas =============

class ProfileResponse(BaseModel):
    """Complete profile response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: str
    phone: Optional[str] = None
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    professional_headline: Optional[str] = None
    professional_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # User data (from user table)
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_picture: Optional[str] = None
    
    # Nested data
    work_experiences: List["WorkExperienceResponse"] = []
    education_records: List["EducationRecordResponse"] = []
    certifications: List["CertificationResponse"] = []
    skills: List["ProfileSkillResponse"] = []


class WorkExperienceResponse(BaseModel):
    """Work experience response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    profile_id: str
    job_title: str
    company: str
    location: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    is_current: bool
    master_description: str
    created_at: datetime
    updated_at: datetime


class EducationRecordResponse(BaseModel):
    """Education record response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    profile_id: str
    school_university: str
    degree: str
    field_of_study: str
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool
    gpa: Optional[str] = None
    honors: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CertificationResponse(BaseModel):
    """Certification response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    profile_id: str
    name: str
    issuing_body: str
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    issue_date: Optional[date] = None
    expiration_date: Optional[date] = None
    does_not_expire: bool
    created_at: datetime
    updated_at: datetime


class ProfileSkillResponse(BaseModel):
    """Profile skill response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    profile_id: str
    skill_name: str
    proficiency_level: str
    years_of_experience: Optional[int] = None
    created_at: datetime
    updated_at: datetime


# Update forward references - these will be rebuilt when all models are loaded
def rebuild_profile_models():
    """Rebuild all profile models to resolve forward references"""
    ProfileResponse.model_rebuild()
    WorkExperienceResponse.model_rebuild()
    EducationRecordResponse.model_rebuild()
    CertificationResponse.model_rebuild()
    ProfileSkillResponse.model_rebuild()

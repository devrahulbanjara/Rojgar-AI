from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

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
    name: Optional[str] = None
    issuing_body: Optional[str] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    issue_date: Optional[str] = None
    expiration_date: Optional[str] = None
    does_not_expire: Optional[bool] = None


class UpdateSkillInResumeRequest(BaseModel):
    skill_name: Optional[str] = None
    proficiency_level: Optional[str] = None
    years_of_experience: Optional[int] = None


class ResumeAutofillData(BaseModel):
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


class ResumeResponse(BaseModel):
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
    
    experiences: List["ResumeExperienceResponse"] = []
    educations: List["ResumeEducationResponse"] = []
    certifications: List["ResumeCertificationResponse"] = []
    skills: List["ResumeSkillResponse"] = []


class ResumeExperienceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    resume_id: str
    work_experience_id: str
    custom_description: str
    display_order: int
    created_at: datetime
    updated_at: datetime
    
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_current: Optional[bool] = None
    master_description: Optional[str] = None
    
    work_experience: Optional["WorkExperienceResponse"] = None


class ResumeEducationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    resume_id: str
    education_record_id: str
    display_order: int
    created_at: datetime
    updated_at: datetime
    
    school_university: Optional[str] = None
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_current: Optional[bool] = None
    gpa: Optional[str] = None
    honors: Optional[str] = None
    
    education_record: Optional["EducationRecordResponse"] = None


class ResumeCertificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    resume_id: str
    certification_id: str
    display_order: int
    created_at: datetime
    updated_at: datetime
    
    name: Optional[str] = None
    issuing_body: Optional[str] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    issue_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    does_not_expire: Optional[bool] = None
    
    certification: Optional["CertificationResponse"] = None


class ResumeSkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    resume_id: str
    profile_skill_id: str
    display_order: int
    created_at: datetime
    updated_at: datetime
    
    skill_name: Optional[str] = None
    proficiency_level: Optional[str] = None
    years_of_experience: Optional[int] = None
    
    profile_skill: Optional["ProfileSkillResponse"] = None


def rebuild_models():
    ResumeResponse.model_rebuild()
    ResumeExperienceResponse.model_rebuild()
    ResumeEducationResponse.model_rebuild()
    ResumeCertificationResponse.model_rebuild()
    ResumeSkillResponse.model_rebuild()

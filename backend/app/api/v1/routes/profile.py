"""
Profile API routes - Single Source of Truth management
"""

from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.services.profile_service import ProfileService
from app.models.profile import (
    ProfileResponse, WorkExperienceResponse, EducationRecordResponse,
    CertificationResponse, ProfileSkillResponse
)

router = APIRouter(prefix="/profile", tags=["profile"])


# Request/Response Models
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


# Profile Routes
@router.get("/", response_model=ProfileResponse)
async def get_profile(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get the current user's complete profile"""
    service = ProfileService(db)
    profile = service.get_profile_by_user_id(user_id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please create your profile first."
        )
    
    return profile


@router.post("/", response_model=ProfileResponse)
async def create_profile(
    profile_data: ProfileCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a new profile for the current user"""
    service = ProfileService(db)
    return service.create_profile(user_id, profile_data.model_dump())


@router.put("/", response_model=ProfileResponse)
async def update_profile(
    profile_data: ProfileUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update the current user's profile"""
    service = ProfileService(db)
    return service.update_profile(user_id, profile_data.model_dump(exclude_unset=True))


# Work Experience Routes
@router.post("/work-experience", response_model=WorkExperienceResponse)
async def add_work_experience(
    experience_data: WorkExperienceCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Add a work experience to the profile"""
    service = ProfileService(db)
    return service.add_work_experience(user_id, experience_data.model_dump())


@router.put("/work-experience/{experience_id}", response_model=WorkExperienceResponse)
async def update_work_experience(
    experience_id: str,
    experience_data: WorkExperienceUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update a work experience"""
    service = ProfileService(db)
    return service.update_work_experience(user_id, experience_id, experience_data.model_dump(exclude_unset=True))


@router.delete("/work-experience/{experience_id}")
async def delete_work_experience(
    experience_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete a work experience"""
    service = ProfileService(db)
    service.delete_work_experience(user_id, experience_id)
    return {"message": "Work experience deleted successfully"}


# Education Routes
@router.post("/education", response_model=EducationRecordResponse)
async def add_education(
    education_data: EducationCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Add an education record to the profile"""
    service = ProfileService(db)
    return service.add_education(user_id, education_data.model_dump())


@router.put("/education/{education_id}", response_model=EducationRecordResponse)
async def update_education(
    education_id: str,
    education_data: EducationUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update an education record"""
    service = ProfileService(db)
    return service.update_education(user_id, education_id, education_data.model_dump(exclude_unset=True))


@router.delete("/education/{education_id}")
async def delete_education(
    education_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete an education record"""
    service = ProfileService(db)
    service.delete_education(user_id, education_id)
    return {"message": "Education record deleted successfully"}


# Certification Routes
@router.post("/certifications", response_model=CertificationResponse)
async def add_certification(
    certification_data: CertificationCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Add a certification to the profile"""
    service = ProfileService(db)
    return service.add_certification(user_id, certification_data.model_dump())


@router.put("/certifications/{certification_id}", response_model=CertificationResponse)
async def update_certification(
    certification_id: str,
    certification_data: CertificationUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update a certification"""
    service = ProfileService(db)
    return service.update_certification(user_id, certification_id, certification_data.model_dump(exclude_unset=True))


@router.delete("/certifications/{certification_id}")
async def delete_certification(
    certification_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete a certification"""
    service = ProfileService(db)
    service.delete_certification(user_id, certification_id)
    return {"message": "Certification deleted successfully"}


# Skills Routes
@router.post("/skills", response_model=ProfileSkillResponse)
async def add_skill(
    skill_data: SkillCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Add a skill to the profile"""
    service = ProfileService(db)
    return service.add_skill(user_id, skill_data.model_dump())


@router.put("/skills/{skill_id}", response_model=ProfileSkillResponse)
async def update_skill(
    skill_id: str,
    skill_data: SkillUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update a skill"""
    service = ProfileService(db)
    return service.update_skill(user_id, skill_id, skill_data.model_dump(exclude_unset=True))


@router.delete("/skills/{skill_id}")
async def delete_skill(
    skill_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete a skill"""
    service = ProfileService(db)
    service.delete_skill(user_id, skill_id)
    return {"message": "Skill deleted successfully"}

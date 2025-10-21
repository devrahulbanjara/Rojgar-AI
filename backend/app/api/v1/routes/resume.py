"""
Resume API routes - Tailored views of Profile data
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.services.resume_service import ResumeService
from app.services.profile_service import ProfileService
from app.models.resume import (
    ResumeResponse, ResumeExperienceResponse, ResumeEducationResponse,
    ResumeCertificationResponse, ResumeSkillResponse
)

router = APIRouter(prefix="/resumes", tags=["resumes"])


# Request/Response Models
class ResumeCreateRequest(BaseModel):
    name: str
    contact_full_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_location: Optional[str] = None
    custom_summary: Optional[str] = None


class ResumeUpdateRequest(BaseModel):
    name: Optional[str] = None
    contact_full_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_location: Optional[str] = None
    custom_summary: Optional[str] = None


class AddExperienceToResumeRequest(BaseModel):
    work_experience_id: str
    custom_description: str


class UpdateExperienceInResumeRequest(BaseModel):
    custom_description: str


class AddEducationToResumeRequest(BaseModel):
    education_record_id: str


class AddCertificationToResumeRequest(BaseModel):
    certification_id: str


class AddSkillToResumeRequest(BaseModel):
    profile_skill_id: str


class ResumeAutofillData(BaseModel):
    """Profile data for resume autofill"""
    contact_full_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_location: Optional[str] = None
    professional_summary: Optional[str] = None
    work_experiences: List[dict] = []
    education_records: List[dict] = []
    certifications: List[dict] = []
    skills: List[dict] = []


# Resume Routes
@router.get("/", response_model=List[ResumeResponse])
async def get_resumes(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all resumes for the current user"""
    service = ResumeService(db)
    return service.get_resumes_by_user_id(user_id)


@router.get("/autofill-data", response_model=ResumeAutofillData)
async def get_resume_autofill_data(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get comprehensive profile data for resume autofill"""
    profile_service = ProfileService(db)
    profile = profile_service.get_profile_by_user_id(user_id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Format location
    location = None
    if profile.location_city and profile.location_country:
        location = f"{profile.location_city}, {profile.location_country}"
    elif profile.location_city:
        location = profile.location_city
    elif profile.location_country:
        location = profile.location_country
    
    # Convert profile data to autofill format
    work_experiences = []
    for exp in profile.work_experiences:
        work_experiences.append({
            "id": exp.id,
            "job_title": exp.job_title,
            "company": exp.company,
            "location": exp.location,
            "start_date": exp.start_date.isoformat() if exp.start_date else None,
            "end_date": exp.end_date.isoformat() if exp.end_date else None,
            "is_current": exp.is_current,
            "master_description": exp.master_description
        })
    
    education_records = []
    for edu in profile.education_records:
        education_records.append({
            "id": edu.id,
            "school_university": edu.school_university,
            "degree": edu.degree,
            "field_of_study": edu.field_of_study,
            "location": edu.location,
            "start_date": edu.start_date.isoformat() if edu.start_date else None,
            "end_date": edu.end_date.isoformat() if edu.end_date else None,
            "is_current": edu.is_current,
            "gpa": edu.gpa,
            "honors": edu.honors
        })
    
    certifications = []
    for cert in profile.certifications:
        certifications.append({
            "id": cert.id,
            "name": cert.name,
            "issuing_body": cert.issuing_body,
            "credential_id": cert.credential_id,
            "credential_url": cert.credential_url,
            "issue_date": cert.issue_date.isoformat() if cert.issue_date else None,
            "expiration_date": cert.expiration_date.isoformat() if cert.expiration_date else None,
            "does_not_expire": cert.does_not_expire
        })
    
    skills = []
    for skill in profile.skills:
        skills.append({
            "id": skill.id,
            "skill_name": skill.skill_name,
            "proficiency_level": skill.proficiency_level,
            "years_of_experience": skill.years_of_experience
        })
    
    return ResumeAutofillData(
        contact_full_name=profile.user_name,
        contact_email=profile.user_email,
        contact_phone=profile.phone,
        contact_location=location,
        professional_summary=profile.professional_summary,
        work_experiences=work_experiences,
        education_records=education_records,
        certifications=certifications,
        skills=skills
    )


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get a specific resume by ID"""
    service = ResumeService(db)
    resume = service.get_resume_by_id(user_id, resume_id)
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    return resume


@router.post("/", response_model=ResumeResponse)
async def create_resume(
    resume_data: ResumeCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a new resume"""
    service = ResumeService(db)
    return service.create_resume(user_id, resume_data.model_dump())


@router.put("/{resume_id}", response_model=ResumeResponse)
async def update_resume(
    resume_id: str,
    resume_data: ResumeUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update a resume"""
    service = ResumeService(db)
    return service.update_resume(user_id, resume_id, resume_data.model_dump(exclude_unset=True))


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete a resume"""
    service = ResumeService(db)
    service.delete_resume(user_id, resume_id)
    return {"message": "Resume deleted successfully"}


# Experience Management for Resume
@router.post("/{resume_id}/experiences", response_model=ResumeExperienceResponse)
async def add_experience_to_resume(
    resume_id: str,
    experience_data: AddExperienceToResumeRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Add a work experience to a resume with custom description"""
    service = ResumeService(db)
    return service.add_experience_to_resume(
        user_id, 
        resume_id, 
        experience_data.work_experience_id, 
        experience_data.custom_description
    )


@router.put("/{resume_id}/experiences/{resume_experience_id}", response_model=ResumeExperienceResponse)
async def update_experience_in_resume(
    resume_id: str,
    resume_experience_id: str,
    experience_data: UpdateExperienceInResumeRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update the custom description for an experience in a resume"""
    service = ResumeService(db)
    return service.update_experience_in_resume(
        user_id, 
        resume_id, 
        resume_experience_id, 
        experience_data.custom_description
    )


@router.delete("/{resume_id}/experiences/{resume_experience_id}")
async def remove_experience_from_resume(
    resume_id: str,
    resume_experience_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Remove an experience from a resume"""
    service = ResumeService(db)
    service.remove_experience_from_resume(user_id, resume_id, resume_experience_id)
    return {"message": "Experience removed from resume successfully"}


# Education Management for Resume
@router.post("/{resume_id}/education", response_model=ResumeEducationResponse)
async def add_education_to_resume(
    resume_id: str,
    education_data: AddEducationToResumeRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Add an education record to a resume"""
    service = ResumeService(db)
    return service.add_education_to_resume(user_id, resume_id, education_data.education_record_id)


@router.delete("/{resume_id}/education/{resume_education_id}")
async def remove_education_from_resume(
    resume_id: str,
    resume_education_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Remove an education record from a resume"""
    service = ResumeService(db)
    service.remove_education_from_resume(user_id, resume_id, resume_education_id)
    return {"message": "Education removed from resume successfully"}


# Certification Management for Resume
@router.post("/{resume_id}/certifications", response_model=ResumeCertificationResponse)
async def add_certification_to_resume(
    resume_id: str,
    certification_data: AddCertificationToResumeRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Add a certification to a resume"""
    service = ResumeService(db)
    return service.add_certification_to_resume(user_id, resume_id, certification_data.certification_id)


@router.delete("/{resume_id}/certifications/{resume_certification_id}")
async def remove_certification_from_resume(
    resume_id: str,
    resume_certification_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Remove a certification from a resume"""
    service = ResumeService(db)
    service.remove_certification_from_resume(user_id, resume_id, resume_certification_id)
    return {"message": "Certification removed from resume successfully"}


# Skills Management for Resume
@router.post("/{resume_id}/skills", response_model=ResumeSkillResponse)
async def add_skill_to_resume(
    resume_id: str,
    skill_data: AddSkillToResumeRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Add a skill to a resume"""
    service = ResumeService(db)
    return service.add_skill_to_resume(user_id, resume_id, skill_data.profile_skill_id)


@router.delete("/{resume_id}/skills/{resume_skill_id}")
async def remove_skill_from_resume(
    resume_id: str,
    resume_skill_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Remove a skill from a resume"""
    service = ResumeService(db)
    service.remove_skill_from_resume(user_id, resume_id, resume_skill_id)
    return {"message": "Skill removed from resume successfully"}

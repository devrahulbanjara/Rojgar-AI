from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.services.profile_service import ProfileService
from app.schemas.profile import *

router = APIRouter()


@router.get("/", response_model=ProfileResponse)
async def get_profile(
    user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)
):
    """Get the current user's complete profile"""
    service = ProfileService(db)
    profile = service.get_profile_by_user_id(user_id)

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please create your profile first.",
        )

    return profile


@router.post("/", response_model=ProfileResponse)
async def create_profile(
    profile_data: ProfileCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create a new profile for the current user"""
    service = ProfileService(db)
    return service.create_profile(user_id, profile_data.model_dump())


@router.put("/", response_model=ProfileResponse)
async def update_profile(
    profile_data: ProfileUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update the current user's profile"""
    service = ProfileService(db)
    return service.update_profile(user_id, profile_data.model_dump(exclude_unset=True))


# Work Experience Routes
@router.post("/work-experience", response_model=WorkExperienceResponse)
async def add_work_experience(
    experience_data: WorkExperienceCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Add a work experience to the profile"""
    service = ProfileService(db)
    return service.add_work_experience(user_id, experience_data.model_dump())


@router.put("/work-experience/{experience_id}", response_model=WorkExperienceResponse)
async def update_work_experience(
    experience_id: str,
    experience_data: WorkExperienceUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update a work experience"""
    service = ProfileService(db)
    return service.update_work_experience(
        user_id, experience_id, experience_data.model_dump(exclude_unset=True)
    )


@router.delete(
    "/work-experience/{experience_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_work_experience(
    experience_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete a work experience"""
    service = ProfileService(db)
    service.delete_work_experience(user_id, experience_id)


# Education Routes
@router.post("/education", response_model=EducationRecordResponse)
async def add_education(
    education_data: EducationCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Add an education record to the profile"""
    service = ProfileService(db)
    return service.add_education(user_id, education_data.model_dump())


@router.put("/education/{education_id}", response_model=EducationRecordResponse)
async def update_education(
    education_id: str,
    education_data: EducationUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update an education record"""
    service = ProfileService(db)
    return service.update_education(
        user_id, education_id, education_data.model_dump(exclude_unset=True)
    )


@router.delete("/education/{education_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_education(
    education_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete an education record"""
    service = ProfileService(db)
    service.delete_education(user_id, education_id)


# Certification Routes
@router.post("/certifications", response_model=CertificationResponse)
async def add_certification(
    certification_data: CertificationCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Add a certification to the profile"""
    service = ProfileService(db)
    return service.add_certification(user_id, certification_data.model_dump())


@router.put("/certifications/{certification_id}", response_model=CertificationResponse)
async def update_certification(
    certification_id: str,
    certification_data: CertificationUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update a certification"""
    service = ProfileService(db)
    return service.update_certification(
        user_id, certification_id, certification_data.model_dump(exclude_unset=True)
    )


@router.delete(
    "/certifications/{certification_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_certification(
    certification_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete a certification"""
    service = ProfileService(db)
    service.delete_certification(user_id, certification_id)


# Skills Routes
@router.post("/skills", response_model=ProfileSkillResponse)
async def add_skill(
    skill_data: SkillCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Add a skill to the profile"""
    service = ProfileService(db)
    return service.add_skill(user_id, skill_data.model_dump())


@router.put("/skills/{skill_id}", response_model=ProfileSkillResponse)
async def update_skill(
    skill_id: str,
    skill_data: SkillUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update a skill"""
    service = ProfileService(db)
    return service.update_skill(
        user_id, skill_id, skill_data.model_dump(exclude_unset=True)
    )


@router.delete("/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(
    skill_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete a skill"""
    service = ProfileService(db)
    service.delete_skill(user_id, skill_id)

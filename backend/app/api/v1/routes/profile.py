from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core import get_current_user_id, get_db
from app.schemas.profile import *
from app.services import ProfileService

router = APIRouter()


@router.get("/", response_model=ProfileResponse)
async def get_profile(
    user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)
):
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
    service = ProfileService(db)
    profile = service.create_profile(user_id, profile_data.model_dump())
    db.commit()
    return profile


@router.put("/", response_model=ProfileResponse)
async def update_profile(
    profile_data: ProfileUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    service = ProfileService(db)
    profile = service.update_profile(user_id, profile_data.model_dump(exclude_unset=True))
    db.commit()
    return profile


# Work Experience Routes
@router.post("/work-experience", response_model=WorkExperienceResponse)
async def add_work_experience(
    experience_data: WorkExperienceCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    service = ProfileService(db)
    exp = service.add_work_experience(user_id, experience_data.model_dump())
    db.commit()
    return exp


@router.put("/work-experience/{experience_id}", response_model=WorkExperienceResponse)
async def update_work_experience(
    experience_id: str,
    experience_data: WorkExperienceUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    service = ProfileService(db)
    exp = service.update_work_experience(
        user_id, experience_id, experience_data.model_dump(exclude_unset=True)
    )
    db.commit()
    return exp


@router.delete(
    "/work-experience/{experience_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_work_experience(
    experience_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    service = ProfileService(db)
    service.delete_work_experience(user_id, experience_id)
    db.commit()


# Education Routes
@router.post("/education", response_model=EducationRecordResponse)
async def add_education(
    education_data: EducationCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    service = ProfileService(db)
    edu = service.add_education(user_id, education_data.model_dump())
    db.commit()
    return edu


@router.put("/education/{education_id}", response_model=EducationRecordResponse)
async def update_education(
    education_id: str,
    education_data: EducationUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    service = ProfileService(db)
    edu = service.update_education(
        user_id, education_id, education_data.model_dump(exclude_unset=True)
    )
    db.commit()
    return edu


@router.delete("/education/{education_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_education(
    education_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    service = ProfileService(db)
    service.delete_education(user_id, education_id)
    db.commit()


# Certification Routes
@router.post("/certifications", response_model=CertificationResponse)
async def add_certification(
    certification_data: CertificationCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    service = ProfileService(db)
    cert = service.add_certification(user_id, certification_data.model_dump())
    db.commit()
    return cert


@router.put("/certifications/{certification_id}", response_model=CertificationResponse)
async def update_certification(
    certification_id: str,
    certification_data: CertificationUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    service = ProfileService(db)
    cert = service.update_certification(
        user_id, certification_id, certification_data.model_dump(exclude_unset=True)
    )
    db.commit()
    return cert


@router.delete(
    "/certifications/{certification_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_certification(
    certification_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    service = ProfileService(db)
    service.delete_certification(user_id, certification_id)
    db.commit()


# Skills Routes
@router.post("/skills", response_model=ProfileSkillResponse)
async def add_skill(
    skill_data: SkillCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    service = ProfileService(db)
    skill = service.add_skill(user_id, skill_data.model_dump())
    db.commit()
    return skill


@router.put("/skills/{skill_id}", response_model=ProfileSkillResponse)
async def update_skill(
    skill_id: str,
    skill_data: SkillUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    service = ProfileService(db)
    skill = service.update_skill(
        user_id, skill_id, skill_data.model_dump(exclude_unset=True)
    )
    db.commit()
    return skill


@router.delete("/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(
    skill_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    service = ProfileService(db)
    service.delete_skill(user_id, skill_id)
    db.commit()

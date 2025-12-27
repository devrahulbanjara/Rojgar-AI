from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core import get_current_user_id, get_db
from app.schemas import candidate as schemas
from app.services.candidate import CandidateService

router = APIRouter()


# 1. GET FULL PROFILE
@router.get("/me", response_model=schemas.CandidateProfileFullResponse)
def get_my_profile(
    user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)
):
    profile = CandidateService.get_full_profile(db, user_id)

    # Construct response merging User table data + Profile table data
    return schemas.CandidateProfileFullResponse(
        profile_id=profile.profile_id,
        user_id=profile.user_id,
        full_name=profile.user.name,  # From User Table
        email=profile.user.email,  # From User Table
        picture=profile.user.picture,  # From User Table
        phone=profile.phone,
        location_city=profile.location_city,
        location_country=profile.location_country,
        professional_headline=profile.professional_headline,
        professional_summary=profile.professional_summary,
        social_links=profile.social_links,
        work_experiences=profile.work_experiences,
        educations=profile.educations,
        certifications=profile.certifications,
        skills=profile.skills,
    )


# 2. UPDATE BASIC INFO
@router.patch("/me", response_model=schemas.CandidateProfileFullResponse)
def update_my_profile(
    data: schemas.CandidateProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # Reuse the GET logic to return full object after update
    CandidateService.update_basic_info(db, user_id, data)
    return get_my_profile(user_id, db)


# 3. WORK EXPERIENCE
@router.post("/experience", response_model=schemas.WorkExperienceResponse)
def add_experience(
    data: schemas.WorkExperienceBase,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return CandidateService.add_experience(db, user_id, data)


@router.delete("/experience/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experience(
    item_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    CandidateService.delete_experience(db, user_id, item_id)


@router.patch("/experience/{item_id}", response_model=schemas.WorkExperienceResponse)
def update_experience(
    item_id: str,
    data: schemas.WorkExperienceUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return CandidateService.update_experience(db, user_id, item_id, data)


# 4. EDUCATION
@router.post("/education", response_model=schemas.EducationResponse)
def add_education(
    data: schemas.EducationBase,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return CandidateService.add_education(db, user_id, data)


@router.delete("/education/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_education(
    item_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    CandidateService.delete_education(db, user_id, item_id)


@router.patch("/education/{item_id}", response_model=schemas.EducationResponse)
def update_education(
    item_id: str,
    data: schemas.EducationUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return CandidateService.update_education(db, user_id, item_id, data)


# 5. SKILLS
@router.post("/skills", response_model=schemas.SkillResponse)
def add_skill(
    data: schemas.SkillBase,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return CandidateService.add_skill(db, user_id, data)


@router.delete("/skills/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(
    item_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    CandidateService.delete_skill(db, user_id, item_id)


@router.patch("/skills/{item_id}", response_model=schemas.SkillResponse)
def update_skill(
    item_id: str,
    data: schemas.SkillUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return CandidateService.update_skill(db, user_id, item_id, data)


# 6. CERTIFICATIONS
@router.post("/certifications", response_model=schemas.CertificationResponse)
def add_certification(
    data: schemas.CertificationBase,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return CandidateService.add_certification(db, user_id, data)


@router.delete("/certifications/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_certification(
    item_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    CandidateService.delete_certification(db, user_id, item_id)


@router.patch("/certifications/{item_id}", response_model=schemas.CertificationResponse)
def update_certification(
    item_id: str,
    data: schemas.CertificationUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return CandidateService.update_certification(db, user_id, item_id, data)

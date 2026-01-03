from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core import get_current_user_id, get_db
from app.core.limiter import limiter
from app.schemas import candidate as schemas
from app.services.candidate import CandidateService

router = APIRouter()


@router.get("/me", response_model=schemas.CandidateProfileFullResponse)
@limiter.limit("5/minute")
def get_my_profile(
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    profile = CandidateService.get_full_profile(db, user_id)

    social_links = [
        schemas.SocialLinkResponse.model_validate(item) for item in profile.social_links
    ]
    work_experiences = [
        schemas.WorkExperienceResponse.model_validate(item)
        for item in profile.work_experiences
    ]
    educations = [
        schemas.EducationResponse.model_validate(item) for item in profile.educations
    ]
    certifications = [
        schemas.CertificationResponse.model_validate(item)
        for item in profile.certifications
    ]
    skills = [schemas.SkillResponse.model_validate(item) for item in profile.skills]

    return schemas.CandidateProfileFullResponse(
        profile_id=profile.profile_id,
        user_id=profile.user_id,
        full_name=profile.user.name,
        email=profile.user.email,
        picture=profile.user.picture,
        phone=profile.phone,
        location_city=profile.location_city,
        location_country=profile.location_country,
        professional_headline=profile.professional_headline,
        professional_summary=profile.professional_summary,
        social_links=social_links,
        work_experiences=work_experiences,
        educations=educations,
        certifications=certifications,
        skills=skills,
    )


@router.patch("/me", response_model=schemas.CandidateProfileFullResponse)
@limiter.limit("5/minute")
def update_my_profile(
    request: Request,
    data: schemas.CandidateProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    CandidateService.update_basic_info(db, user_id, data)
    return get_my_profile(request, user_id, db)


@router.post("/experience", response_model=schemas.WorkExperienceResponse)
@limiter.limit("5/minute")
def add_experience(
    request: Request,
    data: schemas.WorkExperienceBase,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return CandidateService.add_experience(db, user_id, data)


@router.delete("/experience/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
def delete_experience(
    request: Request,
    item_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    CandidateService.delete_experience(db, user_id, item_id)


@router.patch("/experience/{item_id}", response_model=schemas.WorkExperienceResponse)
@limiter.limit("5/minute")
def update_experience(
    request: Request,
    item_id: str,
    data: schemas.WorkExperienceUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return CandidateService.update_experience(db, user_id, item_id, data)


@router.post("/education", response_model=schemas.EducationResponse)
@limiter.limit("5/minute")
def add_education(
    request: Request,
    data: schemas.EducationBase,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return CandidateService.add_education(db, user_id, data)


@router.delete("/education/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
def delete_education(
    request: Request,
    item_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    CandidateService.delete_education(db, user_id, item_id)


@router.patch("/education/{item_id}", response_model=schemas.EducationResponse)
@limiter.limit("5/minute")
def update_education(
    request: Request,
    item_id: str,
    data: schemas.EducationUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return CandidateService.update_education(db, user_id, item_id, data)


@router.post("/skills", response_model=schemas.SkillResponse)
@limiter.limit("5/minute")
def add_skill(
    request: Request,
    data: schemas.SkillBase,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return CandidateService.add_skill(db, user_id, data)


@router.delete("/skills/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
def delete_skill(
    request: Request,
    item_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    CandidateService.delete_skill(db, user_id, item_id)


@router.patch("/skills/{item_id}", response_model=schemas.SkillResponse)
@limiter.limit("5/minute")
def update_skill(
    request: Request,
    item_id: str,
    data: schemas.SkillUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return CandidateService.update_skill(db, user_id, item_id, data)


@router.post("/certifications", response_model=schemas.CertificationResponse)
@limiter.limit("5/minute")
def add_certification(
    request: Request,
    data: schemas.CertificationBase,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return CandidateService.add_certification(db, user_id, data)


@router.delete("/certifications/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
def delete_certification(
    request: Request,
    item_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    CandidateService.delete_certification(db, user_id, item_id)


@router.patch("/certifications/{item_id}", response_model=schemas.CertificationResponse)
@limiter.limit("5/minute")
def update_certification(
    request: Request,
    item_id: str,
    data: schemas.CertificationUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return CandidateService.update_certification(db, user_id, item_id, data)


@router.post("/social-links", response_model=schemas.SocialLinkResponse)
@limiter.limit("5/minute")
def add_social_link(
    request: Request,
    data: schemas.SocialLinkBase,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return CandidateService.add_social_link(db, user_id, data)


@router.delete("/social-links/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
def delete_social_link(
    request: Request,
    item_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    CandidateService.delete_social_link(db, user_id, item_id)


@router.patch("/social-links/{item_id}", response_model=schemas.SocialLinkResponse)
@limiter.limit("5/minute")
def update_social_link(
    request: Request,
    item_id: str,
    data: schemas.SocialLinkBase,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return CandidateService.update_social_link(db, user_id, item_id, data)

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core import get_current_active_user, get_db
from app.core.limiter import limiter
from app.models.user import User
from app.schemas import candidate as schemas
from app.schemas import job as job_schemas
from app.services.candidate import CandidateService
from app.services.candidate.saved_job_service import SavedJobService

router = APIRouter()


@router.get("/me", response_model=schemas.CandidateProfileFullResponse)
@limiter.limit("50/minute")
def get_my_profile(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return CandidateService.get_full_profile(db, current_user)


@router.patch("/me", response_model=schemas.CandidateProfileFullResponse)
@limiter.limit("50/minute")
def update_candidate_personal_information(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    data: schemas.CandidateProfileUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return CandidateService.update_basic_info(db, current_user, data)


@router.post("/experience", response_model=schemas.WorkExperienceResponse)
@limiter.limit("50/minute")
def add_experience(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    data: schemas.WorkExperienceBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return CandidateService.add_experience(db, current_user, data)


@router.delete("/experience/{item_id}")
@limiter.limit("50/minute")
def delete_experience(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    CandidateService.delete_experience(db, current_user, item_id)
    return {"message": "Experience deleted successfully"}


@router.patch("/experience/{item_id}", response_model=schemas.WorkExperienceResponse)
@limiter.limit("50/minute")
def update_experience(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    item_id: uuid.UUID,
    data: schemas.WorkExperienceUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return CandidateService.update_experience(db, current_user, item_id, data)


@router.post("/education", response_model=schemas.EducationResponse)
@limiter.limit("50/minute")
def add_education(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    data: schemas.EducationBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return CandidateService.add_education(db, current_user, data)


@router.delete("/education/{item_id}")
@limiter.limit("50/minute")
def delete_education(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    CandidateService.delete_education(db, current_user, item_id)
    return {"message": "Education deleted successfully"}


@router.patch("/education/{item_id}", response_model=schemas.EducationResponse)
@limiter.limit("50/minute")
def update_education(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    item_id: uuid.UUID,
    data: schemas.EducationUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return CandidateService.update_education(db, current_user, item_id, data)


@router.post("/skills", response_model=schemas.SkillResponse)
@limiter.limit("50/minute")
def add_skill(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    data: schemas.SkillBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return CandidateService.add_skill(db, current_user, data)


@router.delete("/skills/{item_id}")
@limiter.limit("50/minute")
def delete_skill(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    CandidateService.delete_skill(db, current_user, item_id)
    return {"message": "Skill deleted successfully"}


@router.patch("/skills/{item_id}", response_model=schemas.SkillResponse)
@limiter.limit("50/minute")
def update_skill(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    item_id: uuid.UUID,
    data: schemas.SkillUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return CandidateService.update_skill(db, current_user, item_id, data)


@router.post("/certifications", response_model=schemas.CertificationResponse)
@limiter.limit("50/minute")
def add_certification(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    data: schemas.CertificationBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return CandidateService.add_certification(db, current_user, data)


@router.delete("/certifications/{item_id}")
@limiter.limit("50/minute")
def delete_certification(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    CandidateService.delete_certification(db, current_user, item_id)
    return {"message": "Certification deleted successfully"}


@router.patch("/certifications/{item_id}", response_model=schemas.CertificationResponse)
@limiter.limit("50/minute")
def update_certification(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    item_id: uuid.UUID,
    data: schemas.CertificationUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return CandidateService.update_certification(db, current_user, item_id, data)


@router.post("/social-links", response_model=schemas.SocialLinkResponse)
@limiter.limit("50/minute")
def add_social_link(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    data: schemas.SocialLinkBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return CandidateService.add_social_link(db, current_user, data)


@router.delete("/social-links/{item_id}")
@limiter.limit("50/minute")
def delete_social_link(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    CandidateService.delete_social_link(db, current_user, item_id)
    return {"message": "Social link deleted successfully"}


@router.patch("/social-links/{item_id}", response_model=schemas.SocialLinkResponse)
@limiter.limit("50/minute")
def update_social_link(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    item_id: uuid.UUID,
    data: schemas.SocialLinkBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return CandidateService.update_social_link(db, current_user, item_id, data)


@router.post("/jobs/{job_id}/save")
@limiter.limit("50/minute")
def toggle_save_job(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return SavedJobService.toggle_save_job(db, current_user.user_id, job_id)


@router.get("/saved-jobs", response_model=job_schemas.JobListResponse)
@limiter.limit("50/minute")
def get_saved_jobs(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    page: int = 1,
    limit: int = 10,
):
    return SavedJobService.get_my_saved_jobs(
        db, current_user.user_id, page=page, limit=limit
    )

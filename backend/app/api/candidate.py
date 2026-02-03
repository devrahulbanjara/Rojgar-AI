import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_current_active_user, get_db
from app.core.config import settings
from app.core.limiter import limiter
from app.models.user import User
from app.schemas import candidate as schemas
from app.schemas import job as job_schemas
from app.services.candidate import CandidateService
from app.services.candidate.saved_job_service import SavedJobService

router = APIRouter()


@router.get("/me", response_model=schemas.CandidateProfileFullResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_my_profile(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await CandidateService.get_full_profile(db, current_user)


@router.patch("/me", response_model=schemas.CandidateProfileFullResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_candidate_personal_information(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    data: schemas.CandidateProfileUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await CandidateService.update_basic_info(db, current_user, data)


@router.post("/experience", response_model=schemas.WorkExperienceResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def add_experience(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    data: schemas.WorkExperienceBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await CandidateService.add_experience(db, current_user, data)


@router.delete("/experience/{item_id}")
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_experience(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    await CandidateService.delete_experience(db, current_user, item_id)
    return {"message": "Experience deleted successfully"}


@router.patch("/experience/{item_id}", response_model=schemas.WorkExperienceResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_experience(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    item_id: uuid.UUID,
    data: schemas.WorkExperienceUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await CandidateService.update_experience(db, current_user, item_id, data)


@router.post("/education", response_model=schemas.EducationResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def add_education(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    data: schemas.EducationBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await CandidateService.add_education(db, current_user, data)


@router.delete("/education/{item_id}")
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_education(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    await CandidateService.delete_education(db, current_user, item_id)
    return {"message": "Education deleted successfully"}


@router.patch("/education/{item_id}", response_model=schemas.EducationResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_education(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    item_id: uuid.UUID,
    data: schemas.EducationUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await CandidateService.update_education(db, current_user, item_id, data)


@router.post("/skills", response_model=schemas.SkillResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def add_skill(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    data: schemas.SkillBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await CandidateService.add_skill(db, current_user, data)


@router.delete("/skills/{item_id}")
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_skill(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    await CandidateService.delete_skill(db, current_user, item_id)
    return {"message": "Skill deleted successfully"}


@router.patch("/skills/{item_id}", response_model=schemas.SkillResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_skill(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    item_id: uuid.UUID,
    data: schemas.SkillUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await CandidateService.update_skill(db, current_user, item_id, data)


@router.post("/certifications", response_model=schemas.CertificationResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def add_certification(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    data: schemas.CertificationBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await CandidateService.add_certification(db, current_user, data)


@router.delete("/certifications/{item_id}")
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_certification(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    await CandidateService.delete_certification(db, current_user, item_id)
    return {"message": "Certification deleted successfully"}


@router.patch("/certifications/{item_id}", response_model=schemas.CertificationResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_certification(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    item_id: uuid.UUID,
    data: schemas.CertificationUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await CandidateService.update_certification(db, current_user, item_id, data)


@router.post("/social-links", response_model=schemas.SocialLinkResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def add_social_link(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    data: schemas.SocialLinkBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await CandidateService.add_social_link(db, current_user, data)


@router.delete("/social-links/{item_id}")
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_social_link(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    await CandidateService.delete_social_link(db, current_user, item_id)
    return {"message": "Social link deleted successfully"}


@router.patch("/social-links/{item_id}", response_model=schemas.SocialLinkResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_social_link(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    item_id: uuid.UUID,
    data: schemas.SocialLinkBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await CandidateService.update_social_link(db, current_user, item_id, data)


@router.post("/jobs/{job_id}/save")
@limiter.limit(settings.RATE_LIMIT_API)
async def toggle_save_job(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await SavedJobService.toggle_save_job(db, current_user.user_id, job_id)


@router.get("/saved-jobs", response_model=job_schemas.JobListResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_saved_jobs(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    page: int = 1,
    limit: int = 10,
):
    return await SavedJobService.get_my_saved_jobs(
        db, current_user.user_id, page=page, limit=limit
    )

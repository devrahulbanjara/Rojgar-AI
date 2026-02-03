import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_current_active_user, get_db
from app.core.config import settings
from app.core.limiter import limiter
from app.models.user import User
from app.schemas import (
    CertificationBase,
    EducationBase,
    ResumeCertificationResponse,
    ResumeCertificationUpdate,
    ResumeEducationResponse,
    ResumeEducationUpdate,
    ResumeSkillResponse,
    ResumeSkillUpdate,
    ResumeWorkExperienceResponse,
    ResumeWorkExperienceUpdate,
    SkillBase,
    WorkExperienceBase,
)
from app.schemas import resume as schemas
from app.services.candidate.resume_service import ResumeService

router = APIRouter()


@router.get("/", response_model=list[schemas.ResumeListResponse])
@limiter.limit(settings.RATE_LIMIT_API)
async def list_resumes(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await ResumeService.list_resumes(db, current_user)


@router.post(
    "/", response_model=schemas.ResumeResponse, status_code=status.HTTP_201_CREATED
)
@limiter.limit(settings.RATE_LIMIT_API)
async def create_resume(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    data: schemas.ResumeCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await ResumeService.create_resume_fork(db, current_user, data)


@router.get("/{resume_id}", response_model=schemas.ResumeResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_resume(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    resume_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await ResumeService.get_resume(db, current_user, resume_id)


@router.patch("/{resume_id}", response_model=schemas.ResumeResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_resume_details(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    resume_id: uuid.UUID,
    data: schemas.ResumeUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await ResumeService.update_resume(db, current_user, resume_id, data)


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_resume(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    resume_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    await ResumeService.delete_resume(db, current_user, resume_id)
    return {"message": "Resume deleted successfully"}


@router.post(
    "/{resume_id}/experience", response_model=schemas.ResumeWorkExperienceResponse
)
@limiter.limit(settings.RATE_LIMIT_API)
async def add_resume_experience(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    resume_id: uuid.UUID,
    data: WorkExperienceBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await ResumeService.add_experience(db, current_user, resume_id, data)


@router.delete("/{resume_id}/experience/{item_id}")
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_resume_experience(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    resume_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    await ResumeService.delete_experience(db, current_user, resume_id, item_id)
    return {"message": "Resume experience deleted successfully"}


@router.post(
    "/{resume_id}/education",
    response_model=ResumeEducationResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit(settings.RATE_LIMIT_API)
async def add_resume_education(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    resume_id: uuid.UUID,
    data: EducationBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await ResumeService.add_education(db, current_user, resume_id, data)


@router.delete(
    "/{resume_id}/education/{item_id}", status_code=status.HTTP_204_NO_CONTENT
)
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_resume_education(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    resume_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    await ResumeService.delete_education(db, current_user, resume_id, item_id)
    return {"message": "Resume education deleted successfully"}


@router.post(
    "/{resume_id}/skills",
    response_model=ResumeSkillResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit(settings.RATE_LIMIT_API)
async def add_resume_skill(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    resume_id: uuid.UUID,
    data: SkillBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await ResumeService.add_skill(db, current_user, resume_id, data)


@router.delete("/{resume_id}/skills/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_resume_skill(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    resume_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    await ResumeService.delete_skill(db, current_user, resume_id, item_id)
    return {"message": "Resume skill deleted successfully"}


@router.post(
    "/{resume_id}/certifications",
    response_model=ResumeCertificationResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit(settings.RATE_LIMIT_API)
async def add_resume_certification(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    resume_id: uuid.UUID,
    data: CertificationBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await ResumeService.add_certification(db, current_user, resume_id, data)


@router.delete(
    "/{resume_id}/certifications/{item_id}", status_code=status.HTTP_204_NO_CONTENT
)
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_resume_certification(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    resume_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    await ResumeService.delete_certification(db, current_user, resume_id, item_id)
    return {"message": "Resume certification deleted successfully"}


@router.patch(
    "/{resume_id}/experience/{item_id}", response_model=ResumeWorkExperienceResponse
)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_resume_experience(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    resume_id: uuid.UUID,
    item_id: uuid.UUID,
    data: ResumeWorkExperienceUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await ResumeService.update_experience(
        db, current_user, resume_id, item_id, data
    )


@router.patch(
    "/{resume_id}/education/{item_id}", response_model=ResumeEducationResponse
)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_resume_education(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    resume_id: uuid.UUID,
    item_id: uuid.UUID,
    data: ResumeEducationUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await ResumeService.update_education(
        db, current_user, resume_id, item_id, data
    )


@router.patch("/{resume_id}/skills/{item_id}", response_model=ResumeSkillResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_resume_skill(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    resume_id: uuid.UUID,
    item_id: uuid.UUID,
    data: ResumeSkillUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await ResumeService.update_skill(db, current_user, resume_id, item_id, data)


@router.patch(
    "/{resume_id}/certifications/{item_id}", response_model=ResumeCertificationResponse
)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_resume_certification(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    resume_id: uuid.UUID,
    item_id: uuid.UUID,
    data: ResumeCertificationUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await ResumeService.update_certification(
        db, current_user, resume_id, item_id, data
    )

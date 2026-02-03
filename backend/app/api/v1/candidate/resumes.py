import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.dependencies import get_resume_service
from app.core import get_current_active_user
from app.core.config import settings
from app.core.limiter import limiter
from app.db.models.user import User
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
    resume_service: Annotated[ResumeService, Depends(get_resume_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await resume_service.list_resumes(current_user)


@router.post(
    "/", response_model=schemas.ResumeResponse, status_code=status.HTTP_201_CREATED
)
@limiter.limit(settings.RATE_LIMIT_API)
async def create_resume(
    request: Request,
    resume_service: Annotated[ResumeService, Depends(get_resume_service)],
    data: schemas.ResumeCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    resume = await resume_service.create_resume_fork(current_user, data)
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidate profile not found"
        )
    return resume


@router.get("/{resume_id}", response_model=schemas.ResumeResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_resume(
    request: Request,
    resume_service: Annotated[ResumeService, Depends(get_resume_service)],
    resume_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    resume = await resume_service.get_resume(current_user, resume_id)
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found"
        )
    return resume


@router.patch("/{resume_id}", response_model=schemas.ResumeResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_resume_details(
    request: Request,
    resume_service: Annotated[ResumeService, Depends(get_resume_service)],
    resume_id: uuid.UUID,
    data: schemas.ResumeUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    resume = await resume_service.update_resume(current_user, resume_id, data)
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found"
        )
    return resume


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_resume(
    request: Request,
    resume_service: Annotated[ResumeService, Depends(get_resume_service)],
    resume_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    resume = await resume_service.delete_resume(current_user, resume_id)
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found"
        )


@router.post(
    "/{resume_id}/experience", response_model=schemas.ResumeWorkExperienceResponse
)
@limiter.limit(settings.RATE_LIMIT_API)
async def add_resume_experience(
    request: Request,
    resume_service: Annotated[ResumeService, Depends(get_resume_service)],
    resume_id: uuid.UUID,
    data: WorkExperienceBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    experience = await resume_service.add_experience(current_user, resume_id, data)
    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found"
        )
    return experience


@router.delete("/{resume_id}/experience/{item_id}")
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_resume_experience(
    request: Request,
    resume_service: Annotated[ResumeService, Depends(get_resume_service)],
    resume_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    item = await resume_service.delete_experience(current_user, resume_id, item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Experience item not found"
        )
    return {"message": "Resume experience deleted successfully"}


@router.post(
    "/{resume_id}/education",
    response_model=ResumeEducationResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit(settings.RATE_LIMIT_API)
async def add_resume_education(
    request: Request,
    resume_service: Annotated[ResumeService, Depends(get_resume_service)],
    resume_id: uuid.UUID,
    data: EducationBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    education = await resume_service.add_education(current_user, resume_id, data)
    if not education:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found"
        )
    return education


@router.delete(
    "/{resume_id}/education/{item_id}", status_code=status.HTTP_204_NO_CONTENT
)
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_resume_education(
    request: Request,
    resume_service: Annotated[ResumeService, Depends(get_resume_service)],
    resume_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    item = await resume_service.delete_education(current_user, resume_id, item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Education item not found"
        )


@router.post(
    "/{resume_id}/skills",
    response_model=ResumeSkillResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit(settings.RATE_LIMIT_API)
async def add_resume_skill(
    request: Request,
    resume_service: Annotated[ResumeService, Depends(get_resume_service)],
    resume_id: uuid.UUID,
    data: SkillBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    skill = await resume_service.add_skill(current_user, resume_id, data)
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found"
        )
    return skill


@router.delete("/{resume_id}/skills/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_resume_skill(
    request: Request,
    resume_service: Annotated[ResumeService, Depends(get_resume_service)],
    resume_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    item = await resume_service.delete_skill(current_user, resume_id, item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Skill item not found"
        )


@router.post(
    "/{resume_id}/certifications",
    response_model=ResumeCertificationResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit(settings.RATE_LIMIT_API)
async def add_resume_certification(
    request: Request,
    resume_service: Annotated[ResumeService, Depends(get_resume_service)],
    resume_id: uuid.UUID,
    data: CertificationBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    certification = await resume_service.add_certification(
        current_user, resume_id, data
    )
    if not certification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found"
        )
    return certification


@router.delete(
    "/{resume_id}/certifications/{item_id}", status_code=status.HTTP_204_NO_CONTENT
)
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_resume_certification(
    request: Request,
    resume_service: Annotated[ResumeService, Depends(get_resume_service)],
    resume_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    item = await resume_service.delete_certification(current_user, resume_id, item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Certification item not found"
        )


@router.patch(
    "/{resume_id}/experience/{item_id}", response_model=ResumeWorkExperienceResponse
)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_resume_experience(
    request: Request,
    resume_service: Annotated[ResumeService, Depends(get_resume_service)],
    resume_id: uuid.UUID,
    item_id: uuid.UUID,
    data: ResumeWorkExperienceUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    experience = await resume_service.update_experience(
        current_user, resume_id, item_id, data
    )
    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work experience record not found",
        )
    return experience


@router.patch(
    "/{resume_id}/education/{item_id}", response_model=ResumeEducationResponse
)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_resume_education(
    request: Request,
    resume_service: Annotated[ResumeService, Depends(get_resume_service)],
    resume_id: uuid.UUID,
    item_id: uuid.UUID,
    data: ResumeEducationUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    education = await resume_service.update_education(
        current_user, resume_id, item_id, data
    )
    if not education:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Education record not found"
        )
    return education


@router.patch("/{resume_id}/skills/{item_id}", response_model=ResumeSkillResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_resume_skill(
    request: Request,
    resume_service: Annotated[ResumeService, Depends(get_resume_service)],
    resume_id: uuid.UUID,
    item_id: uuid.UUID,
    data: ResumeSkillUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    skill = await resume_service.update_skill(current_user, resume_id, item_id, data)
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Skill record not found"
        )
    return skill


@router.patch(
    "/{resume_id}/certifications/{item_id}", response_model=ResumeCertificationResponse
)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_resume_certification(
    request: Request,
    resume_service: Annotated[ResumeService, Depends(get_resume_service)],
    resume_id: uuid.UUID,
    item_id: uuid.UUID,
    data: ResumeCertificationUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    certification = await resume_service.update_certification(
        current_user, resume_id, item_id, data
    )
    if not certification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification record not found",
        )
    return certification

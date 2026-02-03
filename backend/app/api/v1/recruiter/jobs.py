import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status

from app.api.dependencies import (
    get_job_generation_service,
    get_job_service,
    get_reference_jd_service,
    get_shortlist_service,
)
from app.core import get_current_active_user
from app.core.authorization import (
    require_recruiter_with_organization,
    verify_user_can_edit_job,
)
from app.core.config import settings
from app.core.limiter import limiter
from app.db.models.user import User
from app.schemas import job as schemas
from app.services.job_service import JobService
from app.services.recruiter.job_generation_service import JobGenerationService
from app.services.recruiter.reference_jd_service import ReferenceJDService
from app.services.recruiter.shortlist_service import ShortlistService

router = APIRouter()


# Job Generation & Drafting
@router.post(
    "/generate-draft",
    response_model=schemas.JobDraftResponse,
    status_code=status.HTTP_200_OK,
)
@limiter.limit(settings.RATE_LIMIT_API)
async def generate_job_draft(
    request: Request,
    draft_request: schemas.JobDraftGenerateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    job_generation_service: Annotated[
        JobGenerationService, Depends(get_job_generation_service)
    ],
):
    if not draft_request.raw_requirements:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Raw requirements / some keywords are required",
        )
    try:
        organization_id = require_recruiter_with_organization(current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    generated_draft = await job_generation_service.generate_job_draft(
        title=draft_request.title,
        raw_requirements=draft_request.raw_requirements,
        reference_jd_id=draft_request.reference_jd_id,
        organization_id=organization_id,
        current_draft=draft_request.current_draft,
    )
    if not generated_draft or not generated_draft.get("draft"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to generate job description. Please check your requirements and try again.",
        )
    draft = generated_draft["draft"]
    return draft


# Job CRUD Operations
@router.post(
    "", response_model=schemas.JobResponse, status_code=status.HTTP_201_CREATED
)
@limiter.limit(settings.RATE_LIMIT_API)
async def create_job(
    request: Request,
    job_data: schemas.JobCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    job_service: Annotated[JobService, Depends(get_job_service)],
):
    try:
        organization_id = require_recruiter_with_organization(current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    job_posting = await job_service.create_job(
        job_data=job_data,
        user_id=current_user.user_id,
        organization_id=organization_id,
    )
    return job_posting


@router.put(
    "/{job_id}", response_model=schemas.JobResponse, status_code=status.HTTP_200_OK
)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_job(
    request: Request,
    job_id: uuid.UUID,
    job_data: schemas.JobUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    job_service: Annotated[JobService, Depends(get_job_service)],
):
    job_posting = await job_service.get_job_by_id(job_id)
    if not job_posting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
    try:
        verify_user_can_edit_job(current_user, job_posting)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    updated_job = await job_service.update_job(
        job_posting=job_posting, job_data=job_data
    )
    return updated_job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_job(
    request: Request,
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    job_service: Annotated[JobService, Depends(get_job_service)],
):
    job = await job_service.delete_job(job_id=job_id, user_id=current_user.user_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )


@router.post(
    "/{job_id}/expire",
    response_model=schemas.JobResponse,
    status_code=status.HTTP_200_OK,
)
@limiter.limit(settings.RATE_LIMIT_API)
async def expire_job(
    request: Request,
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    job_service: Annotated[JobService, Depends(get_job_service)],
):
    job = await job_service.expire_job(job_id=job_id, user_id=current_user.user_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
    return job


# Shortlisting Operations
@router.post("/{job_id}/shortlist", status_code=status.HTTP_200_OK)
@limiter.limit(settings.RATE_LIMIT_SHORTLIST_TRIGGER)
async def trigger_shortlisting(
    request: Request,
    job_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_active_user)],
    job_service: Annotated[JobService, Depends(get_job_service)],
    shortlist_service: Annotated[ShortlistService, Depends(get_shortlist_service)],
):
    job = await job_service.get_job_by_id(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
    try:
        verify_user_can_edit_job(current_user, job)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

    background_tasks.add_task(shortlist_service.process_shortlisting, job_id)

    return {"message": "AI scoring started in background", "job_id": str(job_id)}


@router.get("/{job_id}/shortlist/summary", status_code=status.HTTP_200_OK)
@limiter.limit(settings.RATE_LIMIT_SHORTLIST_SUMMARY)
async def get_shortlisting_summary(
    request: Request,
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    job_service: Annotated[JobService, Depends(get_job_service)],
    shortlist_service: Annotated[ShortlistService, Depends(get_shortlist_service)],
):
    job = await job_service.get_job_by_id(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
    try:
        verify_user_can_edit_job(current_user, job)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

    return await shortlist_service.get_shortlisting_summary(job_id)


# Reference JD Operations
@router.post(
    "/reference-jd",
    response_model=schemas.ReferenceJDResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit(settings.RATE_LIMIT_API)
async def create_reference_jd(
    request: Request,
    data: schemas.CreateReferenceJD,
    current_user: Annotated[User, Depends(get_current_active_user)],
    reference_jd_service: Annotated[
        ReferenceJDService, Depends(get_reference_jd_service)
    ],
):
    try:
        organization_id = require_recruiter_with_organization(current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    return await reference_jd_service.create_reference_jd(
        organization_id=organization_id, data=data
    )


@router.get("/reference-jd", response_model=schemas.ReferenceJDListResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_reference_jds(
    request: Request,
    current_user: Annotated[User, Depends(get_current_active_user)],
    reference_jd_service: Annotated[
        ReferenceJDService, Depends(get_reference_jd_service)
    ],
):
    try:
        organization_id = require_recruiter_with_organization(current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    reference_jds = await reference_jd_service.get_reference_jds(
        organization_id=organization_id
    )
    total = len(reference_jds)
    return {
        "reference_jds": reference_jds,
        "total": total,
        "page": 1,
        "limit": total if total > 0 else 1,
        "total_pages": 1,
        "has_next": False,
        "has_prev": False,
    }


@router.get(
    "/reference-jd/{reference_jd_id}", response_model=schemas.ReferenceJDResponse
)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_reference_jd_by_id(
    request: Request,
    reference_jd_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    reference_jd_service: Annotated[
        ReferenceJDService, Depends(get_reference_jd_service)
    ],
):
    try:
        organization_id = require_recruiter_with_organization(current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    reference_jd = await reference_jd_service.get_reference_jd_by_id(
        reference_jd_id=reference_jd_id, organization_id=organization_id
    )
    if not reference_jd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Reference JD not found"
        )
    return reference_jd


@router.put(
    "/reference-jd/{reference_jd_id}", response_model=schemas.ReferenceJDResponse
)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_reference_jd(
    request: Request,
    reference_jd_id: uuid.UUID,
    data: schemas.CreateReferenceJD,
    current_user: Annotated[User, Depends(get_current_active_user)],
    reference_jd_service: Annotated[
        ReferenceJDService, Depends(get_reference_jd_service)
    ],
):
    try:
        organization_id = require_recruiter_with_organization(current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    reference_jd = await reference_jd_service.update_reference_jd(
        reference_jd_id=reference_jd_id,
        organization_id=organization_id,
        data=data,
    )
    if not reference_jd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Reference JD not found"
        )
    return reference_jd


@router.delete(
    "/reference-jd/{reference_jd_id}", status_code=status.HTTP_204_NO_CONTENT
)
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_reference_jd(
    request: Request,
    reference_jd_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    reference_jd_service: Annotated[
        ReferenceJDService, Depends(get_reference_jd_service)
    ],
):
    try:
        organization_id = require_recruiter_with_organization(current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    reference_jd = await reference_jd_service.delete_reference_jd(
        reference_jd_id=reference_jd_id, organization_id=organization_id
    )
    if not reference_jd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Reference JD not found"
        )

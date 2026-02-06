import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.dependencies import get_job_service
from app.core import get_current_active_user
from app.core.config import settings
from app.core.limiter import limiter
from app.core.security import get_current_active_user_optional
from app.db.models.user import User
from app.schemas import job as schemas
from app.services.job_service import JobService

router = APIRouter()


@router.get("/recommendations", response_model=schemas.JobListResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_recommendations(
    request: Request,
    current_user: Annotated[User, Depends(get_current_active_user)],
    job_service: Annotated[JobService, Depends(get_job_service)],
    page: int = 1,
    limit: int = 10,
    employment_type: str | None = None,
    location_type: str | None = None,
):
    return await job_service.get_recommendations(
        user_id=current_user.user_id,
        page=page,
        limit=limit,
        employment_type=employment_type,
        location_type=location_type,
    )


@router.get("/search", response_model=schemas.JobListResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def search_jobs(
    request: Request,
    job_service: Annotated[JobService, Depends(get_job_service)],
    q: str = "",
    page: int = 1,
    limit: int = 10,
    employment_type: str | None = None,
    location_type: str | None = None,
):
    return await job_service.search_jobs(
        query=q,
        page=page,
        limit=limit,
        employment_type=employment_type,
        location_type=location_type,
    )


@router.get("", response_model=schemas.JobListResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_jobs(
    request: Request,
    job_service: Annotated[JobService, Depends(get_job_service)],
    user_id: uuid.UUID | None = None,
    organization_id: uuid.UUID | None = None,
    current_user: Annotated[
        User | None, Depends(get_current_active_user_optional)
    ] = None,
    status: str | None = None,
    page: int = 1,
    limit: int = 10,
):
    if (
        user_id is None
        and current_user
        and organization_id
        and (current_user.organization_id == organization_id)
    ):
        user_id = current_user.user_id
    return await job_service.get_jobs(
        user_id=user_id,
        organization_id=organization_id,
        status=status,
        page=page,
        limit=limit,
    )


@router.get("/{job_id}", response_model=schemas.JobResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_job_detail(
    request: Request,
    job_id: uuid.UUID,
    job_service: Annotated[JobService, Depends(get_job_service)],
):
    job = await job_service.get_job_by_id(job_id=job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
    return job

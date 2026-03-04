from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.auth.dependencies import (
    get_current_user,
)
from app.modules.auth.models import User
from app.modules.jobs import service
from app.modules.jobs.schemas import (
    JobCreate,
    JobDetailResponse,
    JobListItem,
    JobUpdate,
)
from app.shared.enums import LocationType

router = APIRouter()

db = Depends(get_db)


@router.post(
    "/",
    response_model=UnifiedResponse[JobDetailResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new job posting (company admin or recruiter)",
)
async def create_job(
    payload: JobCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = db,
):
    data = await service.create_job(db, user, payload)
    return ResponseBuilder.success(
        data=data,
        message="Job created.",
        status_code=status.HTTP_201_CREATED,
    )


@router.get(
    "/",
    response_model=UnifiedResponse[list[JobListItem]],
    summary="Search and list open jobs with optional filters",
)
async def search_jobs(
    q: str | None = Query(default=None, description="Search keyword for title"),
    location: str | None = Query(default=None),
    location_type: LocationType | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = db,
):
    data = await service.search_jobs(db, q, location, location_type, page, size)
    return ResponseBuilder.success(data=data, message="Jobs fetched.")


@router.get(
    "/company/me",
    response_model=UnifiedResponse[list[JobListItem]],
    summary="List all jobs posted by the current user's company",
)
async def list_company_jobs(
    user: User = Depends(get_current_user),
    db: AsyncSession = db,
):
    data = await service.list_company_jobs(db, user)
    return ResponseBuilder.success(data=data, message="Company jobs fetched.")


@router.get(
    "/{job_id}",
    response_model=UnifiedResponse[JobDetailResponse],
    summary="Get full job details including description",
)
async def get_job(
    job_id: str,
    db: AsyncSession = db,
):
    data = await service.get_job_detail(db, job_id)
    return ResponseBuilder.success(data=data, message="Job fetched.")


@router.patch(
    "/{job_id}",
    response_model=UnifiedResponse[JobDetailResponse],
    summary="Update a job posting (owner only)",
)
async def update_job(
    job_id: str,
    payload: JobUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = db,
):
    data = await service.update_job(db, user, job_id, payload)
    return ResponseBuilder.success(data=data, message="Job updated.")


@router.delete(
    "/{job_id}",
    response_model=UnifiedResponse[None],
    summary="Delete a job posting (owner only)",
)
async def delete_job(
    job_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = db,
):
    await service.delete_job(db, user, job_id)
    return ResponseBuilder.success(data=None, message="Job deleted.")

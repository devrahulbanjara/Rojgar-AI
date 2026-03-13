from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import PaginatedData, ResponseBuilder, UnifiedResponse
from app.modules.auth.dependencies import (
    get_current_user,
    get_optional_user,
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
    bg_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = db,
):
    data = await service.create_job(db, user, payload, bg_tasks)
    return ResponseBuilder.success(
        data=data,
        message="Job created.",
        status_code=status.HTTP_201_CREATED,
    )


@router.get(
    "/",
    response_model=UnifiedResponse[PaginatedData[JobListItem]],
    summary="Search jobs or get AI-powered recommendations (semantic, highest→lowest score)",
)
async def search_jobs(
    q: str | None = Query(
        default=None,
        description="Free-text search query (embedded and matched semantically)",
    ),
    location_type: LocationType | None = Query(default=None),
    salary_min: int | None = Query(default=None, ge=0),
    salary_max: int | None = Query(default=None, ge=0),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    user: User | None = Depends(get_optional_user),
    db: AsyncSession = db,
):
    jobs, total = await service.search_jobs(
        db, user, q, location_type, salary_min, salary_max, page, size
    )
    return ResponseBuilder.paginated(
        items=jobs,
        total=total,
        page=page,
        size=size,
        message="Jobs fetched successfully.",
    )


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
    bg_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = db,
):
    data = await service.update_job(db, user, job_id, payload, bg_tasks)
    return ResponseBuilder.success(data=data, message="Job updated.")


@router.delete(
    "/{job_id}",
    response_model=UnifiedResponse[None],
    summary="Delete a job posting (owner only)",
)
async def delete_job(
    job_id: str,
    bg_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = db,
):
    await service.delete_job(db, user, job_id, bg_tasks)
    return ResponseBuilder.success(data=None, message="Job deleted.")

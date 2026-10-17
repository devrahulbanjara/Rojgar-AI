import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Query, status

from app.core.dependencies import (
    ActiveMember,
    CurrentUser,
    DbSession,
    OptionalUser,
    UUIDPath,
)
from app.core.responses import PaginatedData, ResponseBuilder, UnifiedResponse
from app.modules.jobs import service
from app.modules.jobs.schemas import (
    JobCreate,
    JobDetailResponse,
    JobListItem,
    JobUpdate,
)
from app.shared.enums import LocationType

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Create a new job posting (company admin or recruiter)",
)
async def create_job(
    payload: JobCreate,
    bg_tasks: BackgroundTasks,
    user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[JobDetailResponse]:
    """Create a new job for the recruiter's active company."""
    data = await service.create_job(db, user, payload, bg_tasks)
    return ResponseBuilder.success(
        data=data,
        message="Job created.",
        status_code=status.HTTP_201_CREATED,
    )


@router.get(
    "/",
    summary="Search jobs or get AI-powered recommendations (semantic, highest→lowest score)",
)
async def search_jobs(
    q: Annotated[
        str | None,
        Query(description="Free-text search query (embedded and matched semantically)"),
    ] = None,
    location: Annotated[
        str | None, Query(description="Free-text location filter (e.g. 'Kathmandu')")
    ] = None,
    location_type: Annotated[LocationType | None, Query()] = None,
    salary_min: Annotated[int | None, Query(ge=0)] = None,
    salary_max: Annotated[int | None, Query(ge=0)] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    user: OptionalUser = None,
    db: DbSession = None,
) -> UnifiedResponse[PaginatedData[JobListItem]]:
    """Search public jobs with optional personalization."""
    jobs, total = await service.search_jobs(
        db, user, q, location, location_type, salary_min, salary_max, page, size
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
    summary="List all jobs posted by the current user's company",
)
async def list_company_jobs(
    user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[list[JobListItem]]:
    """List jobs for the recruiter's active company."""
    data = await service.list_company_jobs(db, user)
    return ResponseBuilder.success(data=data, message="Company jobs fetched.")


@router.get(
    "/{job_id}",
    summary="Get full job details including description",
)
async def get_job(
    job_id: UUIDPath,
    user: OptionalUser,
    db: DbSession,
) -> UnifiedResponse[JobDetailResponse]:
    """Fetch one job detail payload."""
    data = await service.get_job_detail(db, job_id, user)
    return ResponseBuilder.success(data=data, message="Job fetched.")


@router.patch(
    "/{job_id}",
    summary="Update a job posting (owner only)",
)
async def update_job(
    job_id: UUIDPath,
    payload: JobUpdate,
    bg_tasks: BackgroundTasks,
    user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[JobDetailResponse]:
    """Update a company job."""
    data = await service.update_job(db, user, job_id, payload, bg_tasks)
    return ResponseBuilder.success(data=data, message="Job updated.")


@router.delete(
    "/{job_id}",
    summary="Delete a job posting (owner only)",
)
async def delete_job(
    job_id: UUIDPath,
    bg_tasks: BackgroundTasks,
    user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[None]:
    """Delete a company job."""
    await service.delete_job(db, user, job_id, bg_tasks)
    return ResponseBuilder.success(data=None, message="Job deleted.")


@router.post(
    "/{job_id}/complete-hiring",
    summary="Complete hiring for a job (one-way; auto-rejects pending applicants)",
)
async def complete_hiring(
    job_id: uuid.UUID,
    bg_tasks: BackgroundTasks,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[dict]:
    """Close the hiring lifecycle for a job."""
    data = await service.complete_hiring(db, user, job_id, bg_tasks)
    return ResponseBuilder.success(data=data, message="Hiring completed for this job.")

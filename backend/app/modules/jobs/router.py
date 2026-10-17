from fastapi import APIRouter, BackgroundTasks, status

from app.core.dependencies import (
    ActiveMember,
    CurrentUser,
    DbSession,
    OptionalUser,
    UUIDPath,
)
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.jobs import service
from app.modules.jobs.schemas import (
    JobCreate,
    JobDetailResponse,
    JobListItem,
    JobUpdate,
    SuggestMustHavesRequest,
    SuggestMustHavesResponse,
)

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
    "/suggest-must-haves",
    summary="Suggest must-haves, nice-to-haves and questions from a description",
)
async def suggest_must_haves(
    payload: SuggestMustHavesRequest, user: ActiveMember
) -> UnifiedResponse[SuggestMustHavesResponse]:
    del user  # company members only
    data = await service.suggest_must_haves(payload)
    return ResponseBuilder.success(data=data)

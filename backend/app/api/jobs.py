import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import NotFoundError, get_current_active_user, get_db
from app.core.authorization import get_organization_from_user
from app.core.config import settings
from app.core.exceptions import get_request_context
from app.core.limiter import limiter
from app.core.security import get_current_active_user_optional
from app.models import User
from app.schemas import job as schemas
from app.services.candidate.saved_job_service import SavedJobService
from app.services.job_service import JobService
from app.services.recruiter.activity_events import activity_emitter
from app.services.recruiter.reference_jd_service import ReferenceJDService

router = APIRouter()


@router.get("/recommendations", response_model=schemas.JobListResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_recommendations(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    page: int = 1,
    limit: int = 10,
    employment_type: str | None = None,
    location_type: str | None = None,
):
    saved_job_ids = await SavedJobService.get_saved_job_ids(db, current_user.user_id)
    return await JobService.get_recommendations(
        db=db,
        user_id=current_user.user_id,
        page=page,
        limit=limit,
        employment_type=employment_type,
        location_type=location_type,
        saved_job_ids=saved_job_ids,
    )


@router.get("/search", response_model=schemas.JobListResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def search_jobs(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str = "",
    page: int = 1,
    limit: int = 10,
    employment_type: str | None = None,
    location_type: str | None = None,
    user_id: uuid.UUID | None = None,
):
    saved_job_ids = None
    if user_id:
        saved_job_ids = await SavedJobService.get_saved_job_ids(db, user_id)
    return await JobService.search_jobs(
        db=db,
        query=q,
        page=page,
        limit=limit,
        employment_type=employment_type,
        location_type=location_type,
        saved_job_ids=saved_job_ids,
    )


@router.post(
    "", response_model=schemas.JobResponse, status_code=status.HTTP_201_CREATED
)
@limiter.limit(settings.RATE_LIMIT_API)
async def create_job(
    request: Request,
    background_tasks: BackgroundTasks,
    job_data: schemas.JobCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    organization_id = get_organization_from_user(current_user)
    job_posting, event_data = await JobService.create_job(
        db=db,
        job_data=job_data,
        user_id=current_user.user_id,
        organization_id=organization_id,
    )
    background_tasks.add_task(
        activity_emitter.emit_job_created,
        organization_id=event_data["organization_id"],
        recruiter_name=event_data["recruiter_name"],
        job_title=event_data["job_title"],
        job_id=event_data["job_id"],
        timestamp=event_data["timestamp"],
    )
    return job_posting


@router.get("", response_model=schemas.JobListResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_jobs(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
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
    return await JobService.get_jobs(
        db=db,
        user_id=user_id,
        organization_id=organization_id,
        status=status,
        page=page,
        limit=limit,
    )


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
    db: Annotated[AsyncSession, Depends(get_db)],
):
    organization_id = get_organization_from_user(current_user)
    return await ReferenceJDService.create_reference_jd(
        db=db, organization_id=organization_id, data=data
    )


@router.get("/reference-jd", response_model=schemas.ReferenceJDListResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_reference_jds(
    request: Request,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    organization_id = get_organization_from_user(current_user)
    reference_jds = await ReferenceJDService.get_reference_jds(
        db=db, organization_id=organization_id
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
    db: Annotated[AsyncSession, Depends(get_db)],
):
    organization_id = get_organization_from_user(current_user)
    reference_jd = await ReferenceJDService.get_reference_jd_by_id(
        db=db, reference_jd_id=reference_jd_id, organization_id=organization_id
    )
    if not reference_jd:
        raise NotFoundError(
            message="Reference JD not found",
            details={
                "reference_jd_id": str(reference_jd_id),
                "organization_id": str(organization_id),
                "user_id": str(current_user.user_id),
            },
            user_id=current_user.user_id,
            **get_request_context(request),
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
    db: Annotated[AsyncSession, Depends(get_db)],
):
    organization_id = get_organization_from_user(current_user)
    return await ReferenceJDService.update_reference_jd(
        db=db,
        reference_jd_id=reference_jd_id,
        organization_id=organization_id,
        data=data,
    )


@router.delete(
    "/reference-jd/{reference_jd_id}", status_code=status.HTTP_204_NO_CONTENT
)
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_reference_jd(
    request: Request,
    reference_jd_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    organization_id = get_organization_from_user(current_user)
    await ReferenceJDService.delete_reference_jd(
        db=db, reference_jd_id=reference_jd_id, organization_id=organization_id
    )


@router.get("/{job_id}", response_model=schemas.JobResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_job_detail(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    job_id: uuid.UUID,
    user_id: uuid.UUID | None = None,
):
    saved_job_ids = None
    if user_id:
        saved_job_ids = await SavedJobService.get_saved_job_ids(db, user_id)
    return await JobService.get_job_by_id(
        db=db, job_id=job_id, saved_job_ids=saved_job_ids
    )

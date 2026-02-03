import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_current_active_user, get_db
from app.core.config import settings
from app.core.limiter import limiter
from app.models.user import User
from app.schemas import ApplicationCreate, ApplicationResponse
from app.services.candidate.application_service import ApplicationService
from app.services.recruiter.activity_events import activity_emitter

router = APIRouter()


@router.get(
    "/applications",
    response_model=list[ApplicationResponse],
    status_code=status.HTTP_200_OK,
)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_my_applications(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    applications = await ApplicationService.get_candidate_applications(
        db, current_user.user_id
    )
    if applications is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    return applications


@router.get("/applications/{application_id}", response_model=ApplicationResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_application_detail(
    request: Request,
    application_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    application = await ApplicationService.get_application_by_id(
        db, current_user.user_id, application_id
    )
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    return application


@router.get("/applications/job/{job_id}", response_model=ApplicationResponse | None)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_application_by_job(
    request: Request,
    job_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return await ApplicationService.get_application_by_job(
        db, current_user.user_id, job_id
    )


@router.post(
    "/applications",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit(settings.RATE_LIMIT_API)
async def create_application(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    data: ApplicationCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    try:
        result = await ApplicationService.apply_to_job(
            db, current_user.user_id, data.job_id, data.resume_id
        )
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate profile or Job not found"
            )
        application, event_data = result
    except ValueError as e:
        error_msg = str(e)
        status_code = status.HTTP_400_BAD_REQUEST
        if "already applied" in error_msg.lower():
            status_code = status.HTTP_409_CONFLICT
        
        raise HTTPException(
            status_code=status_code,
            detail=error_msg
        )
    background_tasks.add_task(
        activity_emitter.emit_application_created,
        organization_id=event_data["organization_id"],
        candidate_name=event_data["candidate_name"],
        job_title=event_data["job_title"],
        application_id=event_data["application_id"],
        job_id=event_data["job_id"],
        timestamp=event_data["timestamp"],
    )
    return application

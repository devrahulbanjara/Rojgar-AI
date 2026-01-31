import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Request, status
from sqlalchemy.orm import Session

from app.core import get_current_active_user, get_db
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
@limiter.limit("50/minute")
def get_my_applications(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """List all applications for the current candidate."""
    return ApplicationService.get_candidate_applications(db, current_user.user_id)


@router.get("/applications/{application_id}", response_model=ApplicationResponse)
@limiter.limit("50/minute")
def get_application_detail(
    request: Request,
    application_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Get detailed information about a specific application."""
    return ApplicationService.get_application_by_id(
        db, current_user.user_id, application_id
    )


@router.get("/applications/job/{job_id}", response_model=ApplicationResponse | None)
@limiter.limit("50/minute")
def get_application_by_job(
    request: Request,
    job_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Get application for a specific job if it exists."""
    return ApplicationService.get_application_by_job(db, current_user.user_id, job_id)


@router.post(
    "/applications",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("50/minute")
def create_application(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Annotated[Session, Depends(get_db)],
    data: ApplicationCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    application, event_data = ApplicationService.apply_to_job(
        db, current_user.user_id, data.job_id, data.resume_id
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

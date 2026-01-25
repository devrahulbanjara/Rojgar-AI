from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core import get_current_user_id, get_db
from app.core.limiter import limiter
from app.schemas import ApplicationCreate, ApplicationResponse
from app.services.candidate.application_service import ApplicationService

router = APIRouter()


@router.get("/applications", response_model=list[ApplicationResponse])
@limiter.limit("50/minute")
def get_my_applications(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    user_id: str = Depends(get_current_user_id),
):
    return ApplicationService.get_candidate_applications(db, user_id)


@router.post(
    "/applications",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("50/minute")
def create_application(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    data: ApplicationCreate,
    user_id: str = Depends(get_current_user_id),
):
    return ApplicationService.apply_to_job(
        db, user_id, str(data.job_id), str(data.resume_id)
    )

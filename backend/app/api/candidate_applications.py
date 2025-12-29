from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core import get_current_user_id, get_db
from app.core.limiter import limiter
from app.schemas.application import ApplicationResponse
from app.services.candidate.application_service import ApplicationService

router = APIRouter()


@router.get("/applications", response_model=list[ApplicationResponse])
@limiter.limit("10/minute")
def get_my_applications(
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return ApplicationService.get_candidate_applications(db, user_id)

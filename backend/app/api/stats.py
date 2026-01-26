from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core import get_current_active_user, get_db
from app.core.limiter import limiter
from app.models.user import User
from app.services.recruiter.stats_services import RecruiterStatsService

router = APIRouter()


@router.get("/active-jobs", status_code=status.HTTP_200_OK)
@limiter.limit("50/minute")
def get_active_jobs_count(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    count = RecruiterStatsService.get_active_jobs_count(db=db, user=current_user)
    return {"count": count}

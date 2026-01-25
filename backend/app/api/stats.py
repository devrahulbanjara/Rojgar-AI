from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core import get_current_user_id, get_db
from app.core.limiter import limiter
from app.services.recruiter.stats_services import RecruiterStatsService

router = APIRouter()


@router.get("/active-jobs", status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
def get_active_jobs_count(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    user_id: str = Depends(get_current_user_id),
):
    try:
        count = RecruiterStatsService.get_active_jobs_count(db=db, user_id=user_id)
        return {"count": count}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get active jobs count: {str(e)}",
        )

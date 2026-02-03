from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_current_active_user, get_db
from app.core.config import settings
from app.core.limiter import limiter
from app.models.user import User
from app.services.recruiter.stats_services import RecruiterStatsService

router = APIRouter()


@router.get("/active-jobs", status_code=status.HTTP_200_OK)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_active_jobs_count(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    count = await RecruiterStatsService.get_active_jobs_count(db=db, user=current_user)
    if count is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization statistics unavailable"
        )
    return {"count": count}


@router.get("/active-candidates", status_code=status.HTTP_200_OK)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_active_candidates_count(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    count = await RecruiterStatsService.get_active_candidates_count(
        db=db, user=current_user
    )
    if count is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization statistics unavailable"
        )
    return {"count": count}


@router.get("/recent-activity", status_code=status.HTTP_200_OK)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_recent_activity(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    limit: int = 20,
):
    activities = await RecruiterStatsService.get_recent_activity(
        db=db, user=current_user, limit=limit
    )
    if activities is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization statistics unavailable"
        )
    return {"activities": activities}

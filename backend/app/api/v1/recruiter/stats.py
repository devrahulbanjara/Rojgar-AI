from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.dependencies import get_stats_service
from app.core import get_current_active_user
from app.core.config import settings
from app.core.limiter import limiter
from app.db.models.user import User
from app.services.recruiter.stats_services import StatsService

router = APIRouter()


@router.get("/active-jobs", status_code=status.HTTP_200_OK)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_active_jobs_count(
    request: Request,
    current_user: Annotated[User, Depends(get_current_active_user)],
    stats_service: Annotated[StatsService, Depends(get_stats_service)],
):
    count = await stats_service.get_active_jobs_count(current_user)
    if count is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization statistics unavailable",
        )
    return {"count": count}


@router.get("/active-candidates", status_code=status.HTTP_200_OK)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_active_candidates_count(
    request: Request,
    current_user: Annotated[User, Depends(get_current_active_user)],
    stats_service: Annotated[StatsService, Depends(get_stats_service)],
):
    count = await stats_service.get_active_candidates_count(current_user)
    if count is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization statistics unavailable",
        )
    return {"count": count}


@router.get("/recent-activity", status_code=status.HTTP_200_OK)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_recent_activity(
    request: Request,
    current_user: Annotated[User, Depends(get_current_active_user)],
    stats_service: Annotated[StatsService, Depends(get_stats_service)],
    limit: int = 20,
):
    activities = await stats_service.get_recent_activity(current_user, limit=limit)
    if activities is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization statistics unavailable",
        )
    return {"activities": activities}

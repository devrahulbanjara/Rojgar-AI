from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.dependencies import get_profile_service
from app.core import get_current_active_user
from app.core.config import settings
from app.core.limiter import limiter
from app.db.models.user import User
from app.schemas import candidate as schemas
from app.services.candidate.profile_service import ProfileService

router = APIRouter()


@router.get("", response_model=schemas.CandidateProfileFullResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_my_profile(
    request: Request,
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Get full candidate profile with all nested data."""
    profile = await profile_service.get_full_profile(current_user)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidate profile not found"
        )
    return profile


@router.patch("", response_model=schemas.CandidateProfileFullResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def sync_candidate_profile(
    request: Request,
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
    data: schemas.CandidateProfileUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """
    Master endpoint to update basic info and sync all nested collections
    (experience, education, skills, certifications, social links) in a
    single ACID transaction.
    """
    profile = await profile_service.sync_profile(current_user, data)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidate profile not found"
        )
    return profile

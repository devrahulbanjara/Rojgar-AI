from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.auth.dependencies import require_candidate, get_current_user
from app.modules.auth.models import User
from app.modules.profiles import service
from app.modules.profiles.schemas import ProfileResponse, ProfileUpdate

router = APIRouter()

db = Depends(get_db)


@router.get(
    "/me",
    response_model=UnifiedResponse[ProfileResponse],
    summary="Get the authenticated candidate's profile",
)
async def get_my_profile(
    user: User = Depends(require_candidate),
    db: AsyncSession = db,
):
    data = await service.get_or_create_profile(db, user)
    return ResponseBuilder.success(data=data, message="Profile fetched.")


@router.put(
    "/me",
    response_model=UnifiedResponse[ProfileResponse],
    summary="Update the authenticated candidate's profile",
)
async def update_my_profile(
    payload: ProfileUpdate,
    user: User = Depends(require_candidate),
    db: AsyncSession = db,
):
    data = await service.update_profile(db, user, payload)
    return ResponseBuilder.success(data=data, message="Profile updated.")


@router.get(
    "/{user_id}",
    response_model=UnifiedResponse[ProfileResponse],
    summary="Get a candidate's public profile by user ID",
)
async def get_profile_by_user(
    user_id: str,
    _caller: User = Depends(get_current_user),
    db: AsyncSession = db,
):
    data = await service.get_profile_by_user_id(db, user_id)
    return ResponseBuilder.success(data=data, message="Profile fetched.")

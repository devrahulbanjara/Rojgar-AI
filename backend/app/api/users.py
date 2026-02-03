from typing import Annotated

from fastapi import APIRouter, Depends, Request

from app.api.dependencies import get_user_service
from app.core import get_current_active_user
from app.core.config import settings
from app.core.limiter import limiter
from app.db.models.user import User
from app.schemas import ProfileUpdateRequest, UserResponse
from app.services.user_service import UserService

router = APIRouter()


@router.get("/me", response_model=UserResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_current_user(
    request: Request,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return current_user


@router.put("/profile", response_model=UserResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_profile(
    request: Request,
    profile_data: ProfileUpdateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    user_service: Annotated[UserService, Depends(get_user_service)],
):
    updated_user = await user_service.update_profile(
        current_user.user_id, profile_data.name
    )
    return updated_user if updated_user else current_user

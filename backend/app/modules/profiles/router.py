from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.integrations.s3.service import S3Service
from app.modules.auth.dependencies import require_candidate, get_current_user
from app.modules.auth.models import User
from app.modules.profiles import service
from app.modules.profiles.schemas import (
    CandidateOnboardingRequest,
    ProfileResponse,
    ProfileUpdate,
)

router = APIRouter()
s3_service = S3Service()

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


@router.patch(
    "/me/avatar",
    response_model=UnifiedResponse[ProfileResponse],
    summary="Upload or replace the authenticated candidate's avatar",
)
async def upload_my_avatar(
    file: UploadFile = File(...),
    user: User = Depends(require_candidate),
    db: AsyncSession = db,
):
    previous_avatar_url = user.avatar_url
    new_avatar_url = await s3_service.upload_image(file, folder="avatars")

    user.avatar_url = new_avatar_url
    await db.commit()
    await db.refresh(user)

    if previous_avatar_url and previous_avatar_url != new_avatar_url:
        await s3_service.delete_image(previous_avatar_url)

    data = await service.get_or_create_profile(db, user)
    return ResponseBuilder.success(data=data, message="Avatar updated.")


@router.delete(
    "/me/avatar",
    response_model=UnifiedResponse[None],
    summary="Delete the authenticated candidate's avatar",
)
async def delete_my_avatar(
    user: User = Depends(require_candidate),
    db: AsyncSession = db,
):
    previous_avatar_url = user.avatar_url
    user.avatar_url = None
    await db.commit()
    await db.refresh(user)

    if previous_avatar_url:
        await s3_service.delete_image(previous_avatar_url)

    return ResponseBuilder.success(data=None, message="Avatar removed.")


@router.post(
    "/onboard",
    response_model=UnifiedResponse[ProfileResponse],
    summary="Complete onboarding for a candidate by providing their target roles",
)
async def complete_onboarding(
    payload: CandidateOnboardingRequest,
    user: User = Depends(require_candidate),
    db: AsyncSession = db,
):
    data = await service.complete_onboarding(db, user, payload)
    return ResponseBuilder.success(
        data=data, message="Onboarding completed successfully."
    )


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

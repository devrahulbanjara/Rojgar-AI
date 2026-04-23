from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.infrastructures.storage.service import storage_service
from app.modules.auth.dependencies import require_candidate, get_current_user
from app.modules.auth.models import User
from app.modules.profiles import service
from app.modules.profiles.ai_import_schemas import (
    AiImportCommitRequest,
    AiImportCommitResponse,
    AiImportPreviewResponse,
    AiImportTaskStartResponse,
    AiImportTaskStatusResponse,
)
from app.modules.profiles.ai_import_service import (
    commit_profile_from_ai_import,
    get_resume_import_task_status,
    preview_profile_from_resume_upload,
    start_resume_import_task,
)
from app.modules.profiles.schemas import (
    CandidateOnboardingRequest,
    ProfileResponse,
    ProfileUpdate,
)

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
    """Return the authenticated candidate's profile."""
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
    """Update the authenticated candidate's profile."""
    data = await service.update_profile(db, user, payload)
    return ResponseBuilder.success(data=data, message="Profile updated.")


@router.post(
    "/me/ai-import/upload",
    response_model=UnifiedResponse[AiImportTaskStartResponse],
    summary="Upload a resume PDF and start background extraction",
)
async def start_ai_resume_import(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: User = Depends(require_candidate),
    db: AsyncSession = db,
):
    """Upload a resume and start a background AI import task."""
    data = await start_resume_import_task(db, user, file, background_tasks)
    return ResponseBuilder.success(
        data=data,
        message="Resume import started. Poll the task status for results.",
    )


@router.get(
    "/me/ai-import/tasks/{task_id}",
    response_model=UnifiedResponse[AiImportTaskStatusResponse],
    summary="Check the status of a background resume import task",
)
async def get_ai_resume_import_task(
    task_id: UUID,
    user: User = Depends(require_candidate),
    db: AsyncSession = db,
):
    """Fetch the current status of a resume import task."""
    data = await get_resume_import_task_status(db, user, task_id)
    return ResponseBuilder.success(data=data, message="Resume import task fetched.")


@router.post(
    "/me/ai-import/preview",
    response_model=UnifiedResponse[AiImportPreviewResponse],
    summary="Extract profile data from uploaded resume PDF",
)
async def preview_ai_resume_import(
    file: UploadFile = File(...),
    user: User = Depends(require_candidate),
    db: AsyncSession = db,
):
    """Preview AI-extracted profile data from an uploaded resume."""
    data = await preview_profile_from_resume_upload(db, user, file)
    return ResponseBuilder.success(data=data, message="Resume parsed successfully.")


@router.post(
    "/me/ai-import/commit",
    response_model=UnifiedResponse[AiImportCommitResponse],
    summary="Commit edited AI-imported data to profile or resume",
)
async def commit_ai_resume_import(
    payload: AiImportCommitRequest,
    user: User = Depends(require_candidate),
    db: AsyncSession = db,
):
    """Commit imported resume data to a profile or resume target."""
    data = await commit_profile_from_ai_import(db, user, payload)
    return ResponseBuilder.success(
        data=data,
        message="Imported resume data applied successfully.",
    )


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
    """Upload or replace the candidate's avatar."""
    previous_avatar_url = user.avatar_url
    new_avatar_url = await storage_service.upload_image(file, folder="avatars")

    user.avatar_url = new_avatar_url
    await db.commit()
    await db.refresh(user)

    if previous_avatar_url and previous_avatar_url != new_avatar_url:
        await storage_service.delete_image(previous_avatar_url)

    await service.invalidate_profile_reads(str(user.id))

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
    """Delete the candidate's avatar."""
    previous_avatar_url = user.avatar_url
    user.avatar_url = None
    await db.commit()
    await db.refresh(user)

    if previous_avatar_url:
        await storage_service.delete_image(previous_avatar_url)

    await service.invalidate_profile_reads(str(user.id))

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
    """Complete candidate onboarding and persist target roles."""
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
    """Return a public candidate profile by user ID."""
    data = await service.get_profile_by_user_id(db, user_id)
    return ResponseBuilder.success(data=data, message="Profile fetched.")

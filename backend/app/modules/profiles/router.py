from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, File, UploadFile

from app.core.dependencies import CandidateUser, CurrentUser, DbSession
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.infrastructures.storage.service import storage_service
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

router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.get(
    "/me",
    summary="Get the authenticated candidate's profile",
)
async def get_my_profile(
    user: CandidateUser,
    db: DbSession,
) -> UnifiedResponse[ProfileResponse]:
    """Return the authenticated candidate's profile."""
    data = await service.get_or_create_profile(db, user)
    return ResponseBuilder.success(data=data, message="Profile fetched.")


@router.put(
    "/me",
    summary="Update the authenticated candidate's profile",
)
async def update_my_profile(
    payload: ProfileUpdate,
    user: CandidateUser,
    db: DbSession,
) -> UnifiedResponse[ProfileResponse]:
    """Update the authenticated candidate's profile."""
    data = await service.update_profile(db, user, payload)
    return ResponseBuilder.success(data=data, message="Profile updated.")


@router.post(
    "/me/ai-import/upload",
    summary="Upload a resume PDF and start background extraction",
)
async def start_ai_resume_import(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(),
    user: CandidateUser = None,
    db: DbSession = None,
) -> UnifiedResponse[AiImportTaskStartResponse]:
    """Upload a resume and start a background AI import task."""
    data = await start_resume_import_task(db, user, file, background_tasks)
    return ResponseBuilder.success(
        data=data,
        message="Resume import started. Poll the task status for results.",
    )


@router.get(
    "/me/ai-import/tasks/{task_id}",
    summary="Check the status of a background resume import task",
)
async def get_ai_resume_import_task(
    task_id: UUID,
    user: CandidateUser,
    db: DbSession,
) -> UnifiedResponse[AiImportTaskStatusResponse]:
    """Fetch the current status of a resume import task."""
    data = await get_resume_import_task_status(db, user, task_id)
    return ResponseBuilder.success(data=data, message="Resume import task fetched.")


@router.post(
    "/me/ai-import/preview",
    summary="Extract profile data from uploaded resume PDF",
)
async def preview_ai_resume_import(
    file: UploadFile = File(),
    user: CandidateUser = None,
    db: DbSession = None,
) -> UnifiedResponse[AiImportPreviewResponse]:
    """Preview AI-extracted profile data from an uploaded resume."""
    data = await preview_profile_from_resume_upload(db, user, file)
    return ResponseBuilder.success(data=data, message="Resume parsed successfully.")


@router.post(
    "/me/ai-import/commit",
    summary="Commit edited AI-imported data to profile or resume",
)
async def commit_ai_resume_import(
    payload: AiImportCommitRequest,
    user: CandidateUser,
    db: DbSession,
) -> UnifiedResponse[AiImportCommitResponse]:
    """Commit imported resume data to a profile or resume target."""
    data = await commit_profile_from_ai_import(db, user, payload)
    return ResponseBuilder.success(
        data=data,
        message="Imported resume data applied successfully.",
    )


@router.patch(
    "/me/avatar",
    summary="Upload or replace the authenticated candidate's avatar",
)
async def upload_my_avatar(
    file: UploadFile = File(),
    user: CandidateUser = None,
    db: DbSession = None,
) -> UnifiedResponse[ProfileResponse]:
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
    summary="Delete the authenticated candidate's avatar",
)
async def delete_my_avatar(
    user: CandidateUser,
    db: DbSession,
) -> UnifiedResponse[None]:
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
    summary="Complete onboarding for a candidate by providing their target roles",
)
async def complete_onboarding(
    payload: CandidateOnboardingRequest,
    user: CandidateUser,
    db: DbSession,
) -> UnifiedResponse[ProfileResponse]:
    """Complete candidate onboarding and persist target roles."""
    data = await service.complete_onboarding(db, user, payload)
    return ResponseBuilder.success(
        data=data, message="Onboarding completed successfully."
    )


@router.get(
    "/{user_id}",
    summary="Get a candidate's public profile by user ID",
)
async def get_profile_by_user(
    user_id: UUID,
    caller: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[ProfileResponse]:
    """Return a candidate profile to its owner or to recruiters they applied to."""
    data = await service.get_profile_for_viewer(db, caller, user_id)
    return ResponseBuilder.success(data=data, message="Profile fetched.")

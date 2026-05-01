import uuid

from fastapi import APIRouter, BackgroundTasks, status

from app.core.dependencies import CurrentUser, DbSession
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.job_ai.schemas import (
    CommitDraftRequest,
    GenerateJobDraftRequest,
    JobAIDraftResponse,
    RespondToDraftRequest,
)
from app.modules.job_ai import service

router = APIRouter(prefix="/jobs/ai", tags=["jobs-ai"])


@router.post(
    "/draft",
    status_code=status.HTTP_201_CREATED,
    summary="Generate an AI job draft and pause for recruiter review",
)
async def create_ai_job_draft(
    payload: GenerateJobDraftRequest,
    user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[JobAIDraftResponse]:
    """Generate a new AI-assisted job draft."""
    data = await service.create_draft(db, user, payload)
    return ResponseBuilder.success(
        data=data,
        message="AI draft created.",
        status_code=status.HTTP_201_CREATED,
    )


@router.get(
    "/drafts",
    summary="List AI job drafts for the current recruiter",
)
async def list_ai_job_drafts(
    user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[list[JobAIDraftResponse]]:
    """List AI job drafts owned by the current recruiter."""
    data = await service.list_drafts(db, user)
    return ResponseBuilder.success(data=data, message="AI drafts fetched.")


@router.get(
    "/drafts/{draft_id}",
    summary="Get one AI job draft",
)
async def get_ai_job_draft(
    draft_id: uuid.UUID,
    user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[JobAIDraftResponse]:
    """Fetch one AI job draft."""
    data = await service.get_draft(db, user, draft_id)
    return ResponseBuilder.success(data=data, message="AI draft fetched.")


@router.post(
    "/drafts/{draft_id}/respond",
    summary="Respond to a human-in-the-loop review checkpoint",
)
async def respond_to_ai_job_draft(
    draft_id: uuid.UUID,
    payload: RespondToDraftRequest,
    user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[JobAIDraftResponse]:
    """Submit a recruiter decision for an AI draft review checkpoint."""
    data = await service.respond_to_draft(db, user, draft_id, payload.decision)
    return ResponseBuilder.success(data=data, message="Draft response processed.")


@router.post(
    "/drafts/{draft_id}/commit",
    summary="Commit an approved AI draft into the normal job creation flow",
)
async def commit_ai_job_draft(
    draft_id: uuid.UUID,
    payload: CommitDraftRequest,
    bg_tasks: BackgroundTasks,
    user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[dict]:
    """Commit an approved AI draft into a persisted job."""
    data = await service.commit_draft(db, user, draft_id, payload, bg_tasks)
    return ResponseBuilder.success(data=data, message="AI draft committed as job.")

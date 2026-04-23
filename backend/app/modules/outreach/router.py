import uuid

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.auth.dependencies import require_active_membership
from app.modules.auth.models import User
from app.modules.outreach import service
from app.modules.outreach.schemas import (
    ApproveDraftRequest,
    DeleteDraftsResponse,
    EmailDraftResponse,
    PrepareDraftsRequest,
    PrepareDraftsResponse,
    SendAllResponse,
    UpdateDraftRequest,
)


router = APIRouter()
db_dep = Depends(get_db)


@router.post(
    "/jobs/{job_id}/prepare-drafts",
    response_model=UnifiedResponse[PrepareDraftsResponse],
    summary="Prepare email drafts for shortlisted and rejected candidates",
)
async def prepare_drafts(
    job_id: uuid.UUID,
    payload: PrepareDraftsRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_active_membership),
    db: AsyncSession = db_dep,
):
    """Generate outreach drafts for a job."""
    data = await service.prepare_drafts(
        db, job_id, user.id, background_tasks, payload.direct_send
    )
    return ResponseBuilder.success(data=data, message=data.message)


@router.get(
    "/jobs/{job_id}/drafts",
    response_model=UnifiedResponse[list[EmailDraftResponse]],
    summary="List email drafts for a job",
)
async def get_drafts(
    job_id: uuid.UUID,
    user: User = Depends(require_active_membership),
    db: AsyncSession = db_dep,
):
    """List outreach drafts for a job."""
    data = await service.get_drafts_for_job(db, job_id, user.id)
    return ResponseBuilder.success(data=data, message="Drafts fetched.")


@router.post(
    "/applications/{application_id}/generate-draft",
    response_model=UnifiedResponse[EmailDraftResponse],
    summary="Generate or regenerate a draft for a single candidate",
)
async def generate_draft_for_application(
    application_id: uuid.UUID,
    user: User = Depends(require_active_membership),
    db: AsyncSession = db_dep,
):
    """Generate an outreach draft for one application."""
    data = await service.generate_draft_for_application(db, application_id, user.id)
    return ResponseBuilder.success(data=data, message="Draft generated.")


@router.patch(
    "/drafts/{draft_id}",
    response_model=UnifiedResponse[EmailDraftResponse],
    summary="Edit an outreach email draft before approval",
)
async def update_draft(
    draft_id: uuid.UUID,
    payload: UpdateDraftRequest,
    user: User = Depends(require_active_membership),
    db: AsyncSession = db_dep,
):
    """Update an outreach draft."""
    data = await service.update_draft(db, draft_id, user.id, payload)
    return ResponseBuilder.success(data=data, message="Draft updated.")


@router.delete(
    "/drafts/{draft_id}",
    response_model=UnifiedResponse[DeleteDraftsResponse],
    summary="Delete a single unsent draft",
)
async def delete_draft(
    draft_id: uuid.UUID,
    user: User = Depends(require_active_membership),
    db: AsyncSession = db_dep,
):
    """Delete an outreach draft."""
    data = await service.delete_draft(db, draft_id, user.id)
    return ResponseBuilder.success(data=data, message=data.message)


@router.post(
    "/drafts/{draft_id}/approve",
    response_model=UnifiedResponse[EmailDraftResponse],
    summary="Approve or discard a draft",
)
async def approve_draft(
    draft_id: uuid.UUID,
    payload: ApproveDraftRequest,
    user: User = Depends(require_active_membership),
    db: AsyncSession = db_dep,
):
    """Approve or discard an outreach draft."""
    data = await service.approve_draft(db, draft_id, user.id, payload)
    message = "Draft approved." if payload.approved else "Draft discarded."
    return ResponseBuilder.success(data=data, message=message)


@router.post(
    "/jobs/{job_id}/send-all",
    response_model=UnifiedResponse[SendAllResponse],
    summary="Send all approved drafts for a job in the background",
)
async def send_all_drafts(
    job_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_active_membership),
    db: AsyncSession = db_dep,
):
    """Send all approved drafts for a job."""
    data = await service.send_all_drafts(db, job_id, user.id, background_tasks)
    return ResponseBuilder.success(data=data, message=data.message)


@router.delete(
    "/jobs/{job_id}/drafts",
    response_model=UnifiedResponse[DeleteDraftsResponse],
    summary="Delete all unsent drafts for a job",
)
async def delete_all_drafts(
    job_id: uuid.UUID,
    user: User = Depends(require_active_membership),
    db: AsyncSession = db_dep,
):
    """Delete all drafts for a job."""
    data = await service.delete_all_drafts_for_job(db, job_id, user.id)
    return ResponseBuilder.success(data=data, message=data.message)

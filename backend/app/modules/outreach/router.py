import uuid

from fastapi import APIRouter, BackgroundTasks

from app.core.dependencies import ActiveMember, DbSession
from app.core.responses import ResponseBuilder, UnifiedResponse
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


router = APIRouter(prefix="/outreach", tags=["Outreach"])


@router.post(
    "/jobs/{job_id}/prepare-drafts",
    summary="Prepare email drafts for shortlisted and rejected candidates",
)
async def prepare_drafts(
    job_id: uuid.UUID,
    payload: PrepareDraftsRequest,
    background_tasks: BackgroundTasks,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[PrepareDraftsResponse]:
    """Generate outreach drafts for a job."""
    data = await service.prepare_drafts(
        db, job_id, user.id, background_tasks, payload.direct_send
    )
    return ResponseBuilder.success(data=data, message=data.message)


@router.get(
    "/jobs/{job_id}/drafts",
    summary="List email drafts for a job",
)
async def get_drafts(
    job_id: uuid.UUID,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[list[EmailDraftResponse]]:
    """List outreach drafts for a job."""
    data = await service.get_drafts_for_job(db, job_id, user.id)
    return ResponseBuilder.success(data=data, message="Drafts fetched.")


@router.post(
    "/applications/{application_id}/generate-draft",
    summary="Generate or regenerate a draft for a single candidate",
)
async def generate_draft_for_application(
    application_id: uuid.UUID,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[EmailDraftResponse]:
    """Generate an outreach draft for one application."""
    data = await service.generate_draft_for_application(db, application_id, user.id)
    return ResponseBuilder.success(data=data, message="Draft generated.")


@router.patch(
    "/drafts/{draft_id}",
    summary="Edit an outreach email draft before approval",
)
async def update_draft(
    draft_id: uuid.UUID,
    payload: UpdateDraftRequest,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[EmailDraftResponse]:
    """Update an outreach draft."""
    data = await service.update_draft(db, draft_id, user.id, payload)
    return ResponseBuilder.success(data=data, message="Draft updated.")


@router.delete(
    "/drafts/{draft_id}",
    summary="Delete a single unsent draft",
)
async def delete_draft(
    draft_id: uuid.UUID,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[DeleteDraftsResponse]:
    """Delete an outreach draft."""
    data = await service.delete_draft(db, draft_id, user.id)
    return ResponseBuilder.success(data=data, message=data.message)


@router.post(
    "/drafts/{draft_id}/approve",
    summary="Approve or discard a draft",
)
async def approve_draft(
    draft_id: uuid.UUID,
    payload: ApproveDraftRequest,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[EmailDraftResponse]:
    """Approve or discard an outreach draft."""
    data = await service.approve_draft(db, draft_id, user.id, payload)
    message = "Draft approved." if payload.approved else "Draft discarded."
    return ResponseBuilder.success(data=data, message=message)


@router.post(
    "/jobs/{job_id}/send-all",
    summary="Send all approved drafts for a job in the background",
)
async def send_all_drafts(
    job_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[SendAllResponse]:
    """Send all approved drafts for a job."""
    data = await service.send_all_drafts(db, job_id, user.id, background_tasks)
    return ResponseBuilder.success(data=data, message=data.message)


@router.delete(
    "/jobs/{job_id}/drafts",
    summary="Delete all unsent drafts for a job",
)
async def delete_all_drafts(
    job_id: uuid.UUID,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[DeleteDraftsResponse]:
    """Delete all drafts for a job."""
    data = await service.delete_all_drafts_for_job(db, job_id, user.id)
    return ResponseBuilder.success(data=data, message=data.message)

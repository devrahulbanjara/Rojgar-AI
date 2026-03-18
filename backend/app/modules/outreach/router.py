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
    data = await service.get_drafts_for_job(db, job_id, user.id)
    return ResponseBuilder.success(data=data, message="Drafts fetched.")


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
    data = await service.update_draft(db, draft_id, user.id, payload)
    return ResponseBuilder.success(data=data, message="Draft updated.")


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
    data = await service.send_all_drafts(db, job_id, user.id, background_tasks)
    return ResponseBuilder.success(data=data, message=data.message)

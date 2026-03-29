import uuid

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.auth.dependencies import require_active_membership
from app.modules.auth.models import User
from app.modules.shortlisting import service
from app.modules.shortlisting.schemas import (
    FinalizeShortlistRequest,
    FinalizeShortlistResponse,
    ShortlistSummaryResponse,
    TriggerShortlistResponse,
)


router = APIRouter()
db_dep = Depends(get_db)


@router.post(
    "/jobs/{job_id}/trigger",
    response_model=UnifiedResponse[TriggerShortlistResponse],
    summary="Trigger AI shortlisting for a job in the background",
)
async def trigger_shortlisting(
    job_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_active_membership),
    db: AsyncSession = db_dep,
):
    data = await service.trigger_shortlisting(db, job_id, user.id, background_tasks)
    return ResponseBuilder.success(data=data, message=data.message)


@router.get(
    "/jobs/{job_id}/summary",
    response_model=UnifiedResponse[ShortlistSummaryResponse],
    summary="Get shortlisting summary and current status for a job",
)
async def get_shortlisting_summary(
    job_id: uuid.UUID,
    user: User = Depends(require_active_membership),
    db: AsyncSession = db_dep,
):
    data = await service.get_shortlist_summary(db, job_id, user.id)
    return ResponseBuilder.success(data=data, message="Shortlist summary fetched.")


@router.post(
    "/jobs/{job_id}/finalize",
    response_model=UnifiedResponse[FinalizeShortlistResponse],
    summary="Finalize shortlist and optionally apply AI recommendations",
)
async def finalize_shortlist(
    job_id: uuid.UUID,
    payload: FinalizeShortlistRequest,
    user: User = Depends(require_active_membership),
    db: AsyncSession = db_dep,
):
    data = await service.finalize_shortlist(db, job_id, user.id, payload)
    return ResponseBuilder.success(data=data, message="Shortlist finalized.")

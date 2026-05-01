import uuid

from fastapi import APIRouter, BackgroundTasks

from app.core.dependencies import ActiveMember, DbSession
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.shortlisting import service
from app.modules.shortlisting.schemas import (
    FinalizeShortlistRequest,
    FinalizeShortlistResponse,
    ShortlistSummaryResponse,
    TriggerShortlistResponse,
)


router = APIRouter(prefix="/shortlisting", tags=["Shortlisting"])


@router.post(
    "/jobs/{job_id}/trigger",
    summary="Trigger AI shortlisting for a job in the background",
)
async def trigger_shortlisting(
    job_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[TriggerShortlistResponse]:
    """Trigger AI shortlisting for a job."""
    data = await service.trigger_shortlisting(db, job_id, user.id, background_tasks)
    return ResponseBuilder.success(data=data, message=data.message)


@router.get(
    "/jobs/{job_id}/summary",
    summary="Get shortlisting summary and current status for a job",
)
async def get_shortlisting_summary(
    job_id: uuid.UUID,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[ShortlistSummaryResponse]:
    """Return shortlisting progress and status for a job."""
    data = await service.get_shortlist_summary(db, job_id, user.id)
    return ResponseBuilder.success(data=data, message="Shortlist summary fetched.")


@router.post(
    "/jobs/{job_id}/finalize",
    summary="Finalize shortlist and optionally apply AI recommendations",
)
async def finalize_shortlist(
    job_id: uuid.UUID,
    payload: FinalizeShortlistRequest,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[FinalizeShortlistResponse]:
    """Finalize shortlist decisions for a job."""
    data = await service.finalize_shortlist(db, job_id, user.id, payload)
    return ResponseBuilder.success(data=data, message="Shortlist finalized.")

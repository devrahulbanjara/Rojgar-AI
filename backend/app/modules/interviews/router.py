import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Query

from app.core.dependencies import ActiveMember, CandidateUser, DbSession
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.interviews import service
from app.modules.interviews.schemas import CandidateInterviewView, InterviewResponse

router = APIRouter(prefix="/interviews", tags=["Interviews"])


@router.get(
    "/my",
    summary="List all interviews for the authenticated candidate",
)
async def list_my_interviews(
    user: CandidateUser,
    db: DbSession,
) -> UnifiedResponse[list[CandidateInterviewView]]:
    """List interviews for the authenticated candidate."""
    data = await service.list_candidate_interviews(db, user.id)
    return ResponseBuilder.success(data=data, message="Interviews fetched.")


@router.get(
    "/",
    summary="List all interviews for the recruiter's company",
)
async def list_interviews(
    job_id: Annotated[uuid.UUID | None, Query()] = None,
    start: Annotated[datetime | None, Query()] = None,
    end: Annotated[datetime | None, Query()] = None,
    user: ActiveMember = None,
    db: DbSession = None,
) -> UnifiedResponse[list[InterviewResponse]]:
    """List interviews visible to the recruiter's company."""
    data = await service.list_interviews(db, user.id, job_id, start, end)
    return ResponseBuilder.success(data=data, message="Interviews fetched.")


@router.post(
    "/{interview_id}/complete",
    summary="Mark an interview as completed (recruiter only)",
)
async def mark_interview_complete(
    interview_id: uuid.UUID,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[InterviewResponse]:
    """Mark an interview as completed for the recruiter's company."""
    data = await service.mark_interview_complete(db, user.id, interview_id)
    return ResponseBuilder.success(data=data, message="Interview marked as completed.")

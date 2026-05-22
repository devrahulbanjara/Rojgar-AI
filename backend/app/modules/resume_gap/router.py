from fastapi import APIRouter

from app.core.dependencies import CandidateUser, DbSession
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.resume_gap import service
from app.modules.resume_gap.schemas import (
    AutoPatchRequest,
    AutoPatchResponse,
    GapAnalysisRequest,
    GapAnalysisResult,
    PendingPatchActionRequest,
    PendingPatchActionResponse,
)


router = APIRouter(prefix="/resume-gap", tags=["Resume Gap Analysis"])


@router.post(
    "/analyze",
    summary="Analyze resume gaps against a target job",
)
async def analyze_gaps(
    payload: GapAnalysisRequest,
    user: CandidateUser,
    db: DbSession,
) -> UnifiedResponse[GapAnalysisResult]:
    """Analyze a resume against a target job for improvement gaps."""
    data = await service.analyze_gaps(db, user, payload)
    return ResponseBuilder.success(data=data, message="Gap analysis complete.")


@router.post(
    "/auto-patch",
    summary="Patch a resume safely using AI suggestions",
)
async def auto_patch_resume(
    payload: AutoPatchRequest,
    user: CandidateUser,
    db: DbSession,
) -> UnifiedResponse[AutoPatchResponse]:
    """Generate a safe AI patch preview for a resume (not yet applied)."""
    data = await service.auto_patch_resume(db, user, payload)
    return ResponseBuilder.success(data=data, message=data.message)


@router.post(
    "/commit-patch",
    summary="Apply the pending AI patch to the resume",
)
async def commit_patch(
    payload: PendingPatchActionRequest,
    user: CandidateUser,
    db: DbSession,
) -> UnifiedResponse[PendingPatchActionResponse]:
    """Persist the pending AI patch (preview) onto the candidate's resume."""
    applied = await service.consume_pending_patch(
        db, user, payload.resume_id, payload.job_id
    )
    return ResponseBuilder.success(
        data=PendingPatchActionResponse(applied=applied),
        message="Resume updated." if applied else "No pending patch to apply.",
    )


@router.post(
    "/discard-patch",
    summary="Discard the pending AI patch without applying it",
)
async def discard_patch(
    payload: PendingPatchActionRequest,
    user: CandidateUser,
) -> UnifiedResponse[PendingPatchActionResponse]:
    """Drop the pending AI patch so the resume stays unchanged."""
    await service.discard_pending_patch(user, payload.resume_id, payload.job_id)
    return ResponseBuilder.success(
        data=PendingPatchActionResponse(applied=False),
        message="Pending changes discarded.",
    )

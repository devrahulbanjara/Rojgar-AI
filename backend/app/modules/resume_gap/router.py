from fastapi import APIRouter

from app.core.dependencies import CandidateUser, DbSession
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.resume_gap import service
from app.modules.resume_gap.schemas import (
    AutoPatchRequest,
    AutoPatchResponse,
    GapAnalysisRequest,
    GapAnalysisResult,
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
    """Apply a safe AI-generated patch to a resume."""
    data = await service.auto_patch_resume(db, user, payload)
    return ResponseBuilder.success(data=data, message=data.message)

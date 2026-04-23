from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.auth.dependencies import require_candidate
from app.modules.auth.models import User
from app.modules.resume_gap import service
from app.modules.resume_gap.schemas import (
    AutoPatchRequest,
    AutoPatchResponse,
    GapAnalysisRequest,
    GapAnalysisResult,
)


router = APIRouter()


@router.post(
    "/analyze",
    response_model=UnifiedResponse[GapAnalysisResult],
    summary="Analyze resume gaps against a target job",
)
async def analyze_gaps(
    payload: GapAnalysisRequest,
    user: User = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Analyze a resume against a target job for improvement gaps."""
    data = await service.analyze_gaps(db, user, payload)
    return ResponseBuilder.success(data=data, message="Gap analysis complete.")


@router.post(
    "/auto-patch",
    response_model=UnifiedResponse[AutoPatchResponse],
    summary="Patch a resume safely using AI suggestions",
)
async def auto_patch_resume(
    payload: AutoPatchRequest,
    user: User = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    """Apply a safe AI-generated patch to a resume."""
    data = await service.auto_patch_resume(db, user, payload)
    return ResponseBuilder.success(data=data, message=data.message)

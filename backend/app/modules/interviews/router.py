import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.auth.dependencies import require_active_membership
from app.modules.auth.models import User
from app.modules.interviews import service
from app.modules.interviews.schemas import InterviewResponse

router = APIRouter()


@router.get(
    "/",
    response_model=UnifiedResponse[list[InterviewResponse]],
    summary="List all interviews for the recruiter's company",
)
async def list_interviews(
    job_id: uuid.UUID | None = Query(default=None),
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    user: User = Depends(require_active_membership),
    db: AsyncSession = Depends(get_db),
):
    data = await service.list_interviews(db, user.id, job_id, start, end)
    return ResponseBuilder.success(data=data, message="Interviews fetched.")

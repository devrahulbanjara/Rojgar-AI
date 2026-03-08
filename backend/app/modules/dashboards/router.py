from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.auth.dependencies import (
    require_candidate,
    require_recruiter_privileges,
)
from app.modules.auth.models import User
from app.modules.dashboards import service
from app.modules.dashboards.schemas import CandidateDashboardResponse
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/dashboards", tags=["Dashboards"])


@router.get("/candidate", response_model=UnifiedResponse[CandidateDashboardResponse])
async def get_candidate_dashboard(
    current_user: User = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    data = await service.get_candidate_dashboard(db, current_user)

    return ResponseBuilder.success(
        data=data, message="Candidate dashboard data retrieved"
    )


@router.get("/recruiter")
async def get_recruiter_dashboard(
    current_user: User = Depends(require_recruiter_privileges),
):
    # Accessing the user ID
    recruiter_id = current_user.id

    # Simulating a DB call for recruiter stats
    dummy_stats = {
        "user_id": str(recruiter_id),
        "company_name": "Tech Corp",  # In real life, you'd fetch this from current_user.memberships
        "active_postings": 5,
        "total_applicants": 145,
        "unread_messages": 3,
    }

    return ResponseBuilder.success(
        data=dummy_stats, message="Recruiter dashboard data retrieved"
    )

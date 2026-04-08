from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.auth.dependencies import (
    require_candidate,
    require_recruiter_admin,
    require_recruiter_privileges,
)
from app.modules.auth.models import User
from app.modules.dashboards import service
from app.modules.dashboards.schemas import (
    CandidateDashboardAnalyticsResponse,
    CandidateDashboardResponse,
    RecruiterAdminDashboardAnalyticsResponse,
    RecruiterAdminDashboardResponse,
    RecruiterDashboardAnalyticsResponse,
    RecruiterDashboardResponse,
)

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


@router.get(
    "/candidate/analytics",
    response_model=UnifiedResponse[CandidateDashboardAnalyticsResponse],
)
async def get_candidate_dashboard_analytics(
    range_key: str = "30d",
    current_user: User = Depends(require_candidate),
    db: AsyncSession = Depends(get_db),
):
    data = await service.get_candidate_dashboard_analytics(db, current_user, range_key)
    return ResponseBuilder.success(
        data=data, message="Candidate dashboard analytics retrieved"
    )


@router.get("/recruiter", response_model=UnifiedResponse[RecruiterDashboardResponse])
async def get_recruiter_dashboard(
    current_user: User = Depends(require_recruiter_privileges),
    db: AsyncSession = Depends(get_db),
):
    data = await service.get_recruiter_dashboard(db, current_user)
    return ResponseBuilder.success(
        data=data, message="Recruiter dashboard data retrieved"
    )


@router.get(
    "/recruiter/analytics",
    response_model=UnifiedResponse[RecruiterDashboardAnalyticsResponse],
)
async def get_recruiter_dashboard_analytics(
    range_key: str = "30d",
    current_user: User = Depends(require_recruiter_privileges),
    db: AsyncSession = Depends(get_db),
):
    data = await service.get_recruiter_dashboard_analytics(db, current_user, range_key)
    return ResponseBuilder.success(
        data=data, message="Recruiter dashboard analytics retrieved"
    )


@router.get(
    "/recruiter-admin",
    response_model=UnifiedResponse[RecruiterAdminDashboardResponse],
)
async def get_recruiter_admin_dashboard(
    current_user: User = Depends(require_recruiter_admin),
    db: AsyncSession = Depends(get_db),
):
    data = await service.get_recruiter_admin_dashboard(db, current_user)
    return ResponseBuilder.success(data=data, message="Admin dashboard data retrieved")


@router.get(
    "/recruiter-admin/analytics",
    response_model=UnifiedResponse[RecruiterAdminDashboardAnalyticsResponse],
)
async def get_recruiter_admin_dashboard_analytics(
    range_key: str = "30d",
    current_user: User = Depends(require_recruiter_admin),
    db: AsyncSession = Depends(get_db),
):
    data = await service.get_recruiter_admin_dashboard_analytics(
        db, current_user, range_key
    )
    return ResponseBuilder.success(
        data=data, message="Admin dashboard analytics retrieved"
    )

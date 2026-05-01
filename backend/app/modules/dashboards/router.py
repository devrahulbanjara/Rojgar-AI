from fastapi import APIRouter

from app.core.dependencies import (
    CandidateUser,
    DbSession,
    RecruiterAdmin,
    RecruiterPrivileges,
)
from app.core.responses import ResponseBuilder, UnifiedResponse
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


@router.get("/candidate")
async def get_candidate_dashboard(
    current_user: CandidateUser,
    db: DbSession,
) -> UnifiedResponse[CandidateDashboardResponse]:
    """Return the candidate dashboard summary view."""
    data = await service.get_candidate_dashboard(db, current_user)
    return ResponseBuilder.success(
        data=data, message="Candidate dashboard data retrieved"
    )


@router.get("/candidate/analytics")
async def get_candidate_dashboard_analytics(
    range_key: str = "30d",
    current_user: CandidateUser = None,
    db: DbSession = None,
) -> UnifiedResponse[CandidateDashboardAnalyticsResponse]:
    """Return analytics for the candidate dashboard."""
    data = await service.get_candidate_dashboard_analytics(db, current_user, range_key)
    return ResponseBuilder.success(
        data=data, message="Candidate dashboard analytics retrieved"
    )


@router.get("/recruiter")
async def get_recruiter_dashboard(
    current_user: RecruiterPrivileges,
    db: DbSession,
) -> UnifiedResponse[RecruiterDashboardResponse]:
    """Return the recruiter dashboard summary view."""
    data = await service.get_recruiter_dashboard(db, current_user)
    return ResponseBuilder.success(
        data=data, message="Recruiter dashboard data retrieved"
    )


@router.get("/recruiter/analytics")
async def get_recruiter_dashboard_analytics(
    range_key: str = "30d",
    current_user: RecruiterPrivileges = None,
    db: DbSession = None,
) -> UnifiedResponse[RecruiterDashboardAnalyticsResponse]:
    """Return analytics for the recruiter dashboard."""
    data = await service.get_recruiter_dashboard_analytics(db, current_user, range_key)
    return ResponseBuilder.success(
        data=data, message="Recruiter dashboard analytics retrieved"
    )


@router.get("/recruiter-admin")
async def get_recruiter_admin_dashboard(
    current_user: RecruiterAdmin,
    db: DbSession,
) -> UnifiedResponse[RecruiterAdminDashboardResponse]:
    """Return the recruiter-admin dashboard summary view."""
    data = await service.get_recruiter_admin_dashboard(db, current_user)
    return ResponseBuilder.success(data=data, message="Admin dashboard data retrieved")


@router.get("/recruiter-admin/analytics")
async def get_recruiter_admin_dashboard_analytics(
    range_key: str = "30d",
    current_user: RecruiterAdmin = None,
    db: DbSession = None,
) -> UnifiedResponse[RecruiterAdminDashboardAnalyticsResponse]:
    """Return analytics for the recruiter-admin dashboard."""
    data = await service.get_recruiter_admin_dashboard_analytics(
        db, current_user, range_key
    )
    return ResponseBuilder.success(
        data=data, message="Admin dashboard analytics retrieved"
    )

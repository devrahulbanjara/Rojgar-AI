import uuid
from datetime import date

from fastapi import APIRouter, Query

from app.core.dependencies import ActiveMember, DbSession, ManagerUser
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.dashboards import home, insights
from app.modules.dashboards.schemas import (
    RecruiterHomeResponse,
    RoleCard,
)

router = APIRouter(prefix="/dashboards", tags=["Dashboards"])


@router.get("/recruiter/home")
async def get_recruiter_home(
    current_user: ActiveMember,
    db: DbSession,
    tz: str | None = None,
) -> UnifiedResponse[RecruiterHomeResponse]:
    """Return the recruiter's Today screen: interviews and the work waiting per role.

    ``tz`` is the viewer's IANA timezone (e.g. ``Asia/Kathmandu``) so "today"
    matches the recruiter's calendar, not the server's.
    """
    data = await home.get_recruiter_home(db, current_user, tz)
    return ResponseBuilder.success(data=data, message="Recruiter home retrieved")


@router.get("/recruiter/jobs")
async def get_recruiter_jobs_overview(
    current_user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[list[RoleCard]]:
    """Every company job with applicant and waiting-work counts (jobs table)."""
    data = await home.get_recruiter_jobs_overview(db, current_user)
    return ResponseBuilder.success(data=data, message="Recruiter jobs retrieved")


@router.get("/insights")
async def get_recruiter_insights(
    current_user: ManagerUser,
    db: DbSession,
    job_id: uuid.UUID | None = None,
    start: date | None = Query(None, alias="from"),
    end: date | None = Query(None, alias="to"),
    tz: str | None = None,
) -> UnifiedResponse[insights.InsightsResponse]:
    """Insights for one job or all jobs between two dates (inclusive, viewer's
    timezone): applicant sources, applications per week, reply speed and
    cumulative hiring progress."""
    data = await insights.get_recruiter_insights(
        db, current_user, job_id=job_id, start=start, end=end, tz=tz
    )
    return ResponseBuilder.success(data=data, message="Insights retrieved")

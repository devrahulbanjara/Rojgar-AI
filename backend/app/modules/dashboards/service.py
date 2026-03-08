from __future__ import annotations

import uuid

from app.modules.applications import service as applications_service
from app.modules.applications.models import Application
from app.modules.auth.models import User
from app.modules.dashboards.schemas import (
    CandidateDashboardActivityItem,
    CandidateDashboardResponse,
    CandidateStats,
)
from app.modules.jobs import service as jobs_service
from app.modules.profiles.models import Profile
from app.modules.resumes.models import Resume
from app.shared.enums import ApplicationStatus
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


def _has_text(value: str | None) -> bool:
    return bool(value and value.strip())


def _calculate_profile_completion(profile: Profile | None) -> int:
    if profile is None:
        return 0

    completed_fields = sum(
        [
            _has_text(profile.headline),
            _has_text(profile.summary),
            _has_text(profile.phone),
            _has_text(profile.location),
            _has_text(profile.linkedin_url),
            _has_text(profile.github_url),
            _has_text(profile.portfolio_url),
            profile.years_of_experience is not None,
            len(profile.experiences) > 0,
            len(profile.educations) > 0,
            len(profile.skills) > 0,
        ]
    )

    total_fields = 11
    return round((completed_fields / total_fields) * 100)


async def get_candidate_dashboard_stats(
    db: AsyncSession, user_id: uuid.UUID
) -> CandidateStats:
    stats_stmt = select(
        func.count(Application.id).label("total_applications"),
        func.sum(
            case((Application.status == ApplicationStatus.interview, 1), else_=0)
        ).label("active_interviews"),
        func.sum(
            case((Application.status == ApplicationStatus.offered, 1), else_=0)
        ).label("offers_received"),
    ).where(Application.user_id == user_id)
    stats_row = (await db.execute(stats_stmt)).one()

    total_resumes_stmt = select(func.count(Resume.id)).where(Resume.user_id == user_id)
    total_resumes = await db.scalar(total_resumes_stmt) or 0

    profile_stmt = (
        select(Profile)
        .where(Profile.user_id == user_id)
        .options(
            selectinload(Profile.experiences),
            selectinload(Profile.educations),
            selectinload(Profile.skills),
        )
    )
    profile = await db.scalar(profile_stmt)

    return CandidateStats(
        total_applications=stats_row.total_applications or 0,
        active_interviews=stats_row.active_interviews or 0,
        offers_received=stats_row.offers_received or 0,
        total_resumes=total_resumes,
        profile_completion=_calculate_profile_completion(profile),
    )


async def get_recent_activity(
    recent_applications,
) -> list[CandidateDashboardActivityItem]:
    return [
        CandidateDashboardActivityItem(
            id=application.id,
            application_id=application.id,
            status=application.status,
            text=f"{application.company_name} updated your application for {application.job_title}.",
            time=application.updated_at,
        )
        for application in recent_applications
    ]


async def get_candidate_dashboard(
    db: AsyncSession, current_user: User
) -> CandidateDashboardResponse:
    stats = await get_candidate_dashboard_stats(db, current_user.id)
    recent_applications = await applications_service.list_candidate_applications(
        db=db,
        user_id=current_user.id,
        page=1,
        size=5,
    )
    recent_activity = await get_recent_activity(recent_applications)
    recommended_jobs = await jobs_service.search_jobs(
        db=db,
        q=None,
        location=None,
        location_type=None,
        category=None,
        salary_min=None,
        salary_max=None,
        page=1,
        size=3,
    )

    return CandidateDashboardResponse(
        user_name=current_user.full_name,
        stats=stats,
        recent_applications=recent_applications,
        recent_activity=recent_activity,
        recommended_jobs=recommended_jobs,
    )

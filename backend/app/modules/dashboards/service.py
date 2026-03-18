from __future__ import annotations

import uuid

from app.modules.applications import service as applications_service
from app.modules.applications.models import Application
from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership
from app.modules.dashboards.schemas import (
    CandidateDashboardActivityItem,
    CandidateDashboardResponse,
    CandidateStats,
    RecruiterDashboardResponse,
    RecruiterStats,
)
from app.modules.jobs import service as jobs_service
from app.modules.jobs.models import Job
from app.modules.outreach.models import EmailDraft
from app.modules.profiles.models import Profile
from app.modules.resumes.models import Resume
from app.shared.enums import ApplicationStatus, JobStatus, ShortlistStatus
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructures.redis.service import redis_service


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
    cache_key = f"dashboard:candidate:{current_user.id}"

    cached_data = await redis_service.get(cache_key)
    if cached_data:
        return CandidateDashboardResponse.model_validate_json(cached_data)

    stats = await get_candidate_dashboard_stats(db, current_user.id)
    recent_applications = await applications_service.list_candidate_applications(
        db=db,
        user_id=current_user.id,
        page=1,
        size=5,
    )
    recent_activity = await get_recent_activity(recent_applications)
    recommended_jobs, _ = await jobs_service.search_jobs(
        db=db,
        user=current_user,
        q=None,
        location_type=None,
        salary_min=None,
        salary_max=None,
        page=1,
        size=3,
    )

    response = CandidateDashboardResponse(
        user_name=current_user.full_name,
        stats=stats,
        recent_applications=recent_applications,
        recent_activity=recent_activity,
        recommended_jobs=recommended_jobs,
    )

    # 3. Save to Cache
    await redis_service.set(cache_key, response.model_dump_json(), ttl_seconds=300)

    return response


async def _get_recruiter_company_name(db: AsyncSession, user_id: uuid.UUID) -> str:
    company_name_stmt = (
        select(Company.name)
        .join(CompanyMembership, CompanyMembership.company_id == Company.id)
        .where(
            CompanyMembership.user_id == user_id,
            CompanyMembership.status == MembershipStatus.active,
        )
        .limit(1)
    )
    return await db.scalar(company_name_stmt) or ""


async def get_recruiter_dashboard_stats(
    db: AsyncSession, user_id: uuid.UUID
) -> RecruiterStats:
    company_id_stmt = select(CompanyMembership.company_id).where(
        CompanyMembership.user_id == user_id,
        CompanyMembership.status == MembershipStatus.active,
    )
    company_id = await db.scalar(company_id_stmt)

    if company_id is None:
        return RecruiterStats(
            active_job_posts=0,
            total_applications=0,
            pending_ai_reviews=0,
            pending_email_drafts=0,
        )

    active_job_posts_stmt = select(func.count(Job.id)).where(
        Job.company_id == company_id,
        Job.status == JobStatus.active,
    )
    total_applications_stmt = (
        select(func.count(Application.id))
        .select_from(Job)
        .outerjoin(Application, Application.job_id == Job.id)
        .where(Job.company_id == company_id)
    )

    active_job_posts = await db.scalar(active_job_posts_stmt) or 0
    total_applications = await db.scalar(total_applications_stmt) or 0
    pending_ai_reviews_stmt = (
        select(func.count(Application.id))
        .select_from(Application)
        .join(Job, Job.id == Application.job_id)
        .where(
            Job.company_id == company_id,
            Job.shortlist_status == ShortlistStatus.completed,
            Job.final_shortlist_completed.is_(False),
            Application.status == ApplicationStatus.submitted,
        )
    )
    pending_email_drafts_stmt = (
        select(func.count(EmailDraft.id))
        .select_from(EmailDraft)
        .join(Application, Application.id == EmailDraft.application_id)
        .join(Job, Job.id == Application.job_id)
        .where(
            Job.company_id == company_id,
            EmailDraft.is_sent.is_(False),
            EmailDraft.is_discarded.is_(False),
        )
    )

    pending_ai_reviews = await db.scalar(pending_ai_reviews_stmt) or 0
    pending_email_drafts = await db.scalar(pending_email_drafts_stmt) or 0

    return RecruiterStats(
        active_job_posts=active_job_posts,
        total_applications=total_applications,
        pending_ai_reviews=pending_ai_reviews,
        pending_email_drafts=pending_email_drafts,
    )


async def get_recruiter_dashboard(
    db: AsyncSession, current_user: User
) -> RecruiterDashboardResponse:
    cache_key = f"dashboard:recruiter:{current_user.id}"

    cached_data = await redis_service.get(cache_key)
    if cached_data:
        return RecruiterDashboardResponse.model_validate_json(cached_data)

    company_name = await _get_recruiter_company_name(db, current_user.id)
    stats = await get_recruiter_dashboard_stats(db, current_user.id)
    company_jobs = await jobs_service.list_company_jobs(db=db, user=current_user)
    top_jobs = sorted(
        (job for job in company_jobs if job.status == JobStatus.active),
        key=lambda job: (job.applications_count, job.created_at),
        reverse=True,
    )[:7]

    response = RecruiterDashboardResponse(
        company_name=company_name,
        stats=stats,
        top_jobs=top_jobs,
    )

    await redis_service.set(cache_key, response.model_dump_json(), ttl_seconds=300)
    return response

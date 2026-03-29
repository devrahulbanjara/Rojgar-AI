from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructures.redis.service import redis_service
from app.modules.applications.models import Application
from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.profiles.models import Profile
from app.modules.companies.models import Company, CompanyMembership
from app.modules.dashboards.schemas import (
    ApplicationPipelineItem,
    CandidateDashboardResponse,
    CandidateStats,
    JoinRequestItem,
    JobPipelineItem,
    PendingDraftItem,
    RecruiterAdminDashboardResponse,
    RecruiterAdminStats,
    RecruiterDashboardResponse,
    RecruiterStats,
    TeamMemberActivity,
    TodayInterview,
)
from app.modules.interviews.models import Interview
from app.modules.jobs.models import Job
from app.modules.outreach.models import EmailDraft
from app.shared.enums import ApplicationStatus, JobStatus

PIPELINE_STEPS: dict[ApplicationStatus, int | None] = {
    ApplicationStatus.applied: 1,
    ApplicationStatus.screening: 2,
    ApplicationStatus.shortlisted: 3,
    ApplicationStatus.interview_booked: 4,
    ApplicationStatus.interview_completed: 4,
    ApplicationStatus.offer: 5,
    ApplicationStatus.rejected: None,
}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _today_utc() -> datetime.date:
    return _utcnow().date()


def _pipeline_step(status: ApplicationStatus) -> int | None:
    return PIPELINE_STEPS.get(status)


def _job_days_until_expiry(expires_at: datetime | None) -> int | None:
    if expires_at is None:
        return None
    return (expires_at.date() - _today_utc()).days


def _draft_email_type(application_status: ApplicationStatus) -> str:
    if application_status in {
        ApplicationStatus.shortlisted,
        ApplicationStatus.interview_booked,
        ApplicationStatus.interview_completed,
        ApplicationStatus.offer,
    }:
        return "shortlist"
    return "rejection"


async def _get_company_context(
    db: AsyncSession, user_id: uuid.UUID
) -> tuple[uuid.UUID | None, str]:
    row = await db.execute(
        select(Company.id, Company.name)
        .join(CompanyMembership, CompanyMembership.company_id == Company.id)
        .where(
            CompanyMembership.user_id == user_id,
            CompanyMembership.status == MembershipStatus.active,
        )
        .limit(1)
    )
    result = row.one_or_none()
    if result is None:
        return None, ""
    return result[0], result[1]


async def _get_candidate_stats(db: AsyncSession, user_id: uuid.UUID) -> CandidateStats:
    stats_stmt = select(
        func.count(Application.id).label("total"),
        func.sum(
            case((Application.status == ApplicationStatus.shortlisted, 1), else_=0)
        ).label("shortlisted"),
        func.sum(
            case(
                (
                    Application.status.in_(
                        [
                            ApplicationStatus.interview_booked,
                            ApplicationStatus.interview_completed,
                        ]
                    ),
                    1,
                ),
                else_=0,
            )
        ).label("interviews_booked"),
        func.sum(
            case((Application.status == ApplicationStatus.offer, 1), else_=0)
        ).label("offers"),
        func.sum(
            case((Application.status == ApplicationStatus.rejected, 1), else_=0)
        ).label("rejected"),
    ).where(Application.user_id == user_id)
    stats_row = (await db.execute(stats_stmt)).one()
    return CandidateStats(
        total_applications=stats_row.total or 0,
        shortlisted=stats_row.shortlisted or 0,
        interviews_booked=stats_row.interviews_booked or 0,
        offers=stats_row.offers or 0,
        rejected=stats_row.rejected or 0,
    )


async def get_candidate_dashboard(
    db: AsyncSession, current_user: User
) -> CandidateDashboardResponse:
    cache_key = f"dashboard:candidate:{current_user.id}"
    cached_data = await redis_service.get(cache_key)
    if cached_data:
        return CandidateDashboardResponse.model_validate_json(cached_data)

    stats = await _get_candidate_stats(db, current_user.id)

    profile_result = await db.execute(
        select(Profile.is_open_to_work).where(Profile.user_id == current_user.id)
    )
    is_open_to_work = profile_result.scalar() or False

    application_rows = await db.execute(
        select(
            Application.id,
            Application.job_id,
            Job.title.label("job_title"),
            Company.name.label("company_name"),
            Company.logo_url.label("company_logo_url"),
            Job.location,
            Job.location_type,
            Application.status,
            Application.created_at,
            Application.updated_at,
        )
        .join(Job, Job.id == Application.job_id)
        .join(Company, Company.id == Job.company_id)
        .where(Application.user_id == current_user.id)
        .order_by(Application.updated_at.desc())
        .limit(8)
    )

    applications = [
        ApplicationPipelineItem(
            id=row.id,
            job_id=row.job_id,
            job_title=row.job_title,
            company_name=row.company_name,
            company_logo_url=row.company_logo_url,
            location=row.location,
            location_type=row.location_type,
            status=row.status,
            created_at=row.created_at,
            updated_at=row.updated_at,
            pipeline_step=_pipeline_step(row.status),
            has_pending_action=row.status == ApplicationStatus.shortlisted,
        )
        for row in application_rows.all()
    ]

    pending_action = next((app for app in applications if app.has_pending_action), None)
    urgent_action = None
    if pending_action is not None:
        urgent_action = (
            f"Book your interview for {pending_action.job_title} at "
            f"{pending_action.company_name}"
        )

    response = CandidateDashboardResponse(
        user_name=current_user.full_name,
        is_open_to_work=is_open_to_work,
        stats=stats,
        applications=applications,
        urgent_action=urgent_action,
    )
    await redis_service.set(cache_key, response.model_dump_json(), ttl_seconds=300)
    return response


async def _get_recruiter_stats(
    db: AsyncSession, company_id: uuid.UUID
) -> RecruiterStats:
    today = _today_utc()
    stats_stmt = (
        select(
            func.count(func.distinct(Job.id))
            .filter(Job.status == JobStatus.active)
            .label("active_jobs"),
            func.count(func.distinct(Application.id)).label("total_applications"),
            func.count(func.distinct(Application.id))
            .filter(Application.status == ApplicationStatus.shortlisted)
            .label("shortlisted"),
            func.count(func.distinct(Interview.id))
            .filter(func.date(Interview.start_time) == today)
            .label("interviews_today"),
            func.count(func.distinct(EmailDraft.id))
            .filter(
                EmailDraft.is_sent.is_(False),
                EmailDraft.is_discarded.is_(False),
            )
            .label("pending_drafts"),
        )
        .select_from(Job)
        .outerjoin(Application, Application.job_id == Job.id)
        .outerjoin(Interview, Interview.application_id == Application.id)
        .outerjoin(EmailDraft, EmailDraft.application_id == Application.id)
        .where(Job.company_id == company_id)
    )
    stats_row = (await db.execute(stats_stmt)).one()
    return RecruiterStats(
        active_jobs=stats_row.active_jobs or 0,
        total_applications=stats_row.total_applications or 0,
        shortlisted=stats_row.shortlisted or 0,
        interviews_today=stats_row.interviews_today or 0,
        pending_drafts=stats_row.pending_drafts or 0,
    )


async def _get_active_jobs(
    db: AsyncSession, company_id: uuid.UUID
) -> list[JobPipelineItem]:
    result = await db.execute(
        select(
            Job.id,
            Job.title,
            Job.status,
            Job.expires_at,
            func.count(Application.id).label("total_applications"),
            func.sum(
                case((Application.status == ApplicationStatus.applied, 1), else_=0)
            ).label("applied_count"),
            func.sum(
                case((Application.status == ApplicationStatus.screening, 1), else_=0)
            ).label("screening_count"),
            func.sum(
                case((Application.status == ApplicationStatus.shortlisted, 1), else_=0)
            ).label("shortlisted_count"),
            func.sum(
                case((Application.status == ApplicationStatus.rejected, 1), else_=0)
            ).label("rejected_count"),
        )
        .select_from(Job)
        .outerjoin(Application, Application.job_id == Job.id)
        .where(Job.company_id == company_id, Job.status == JobStatus.active)
        .group_by(Job.id)
        .order_by(Job.expires_at.asc().nulls_last(), Job.created_at.asc())
        .limit(5)
    )

    return [
        JobPipelineItem(
            id=row.id,
            title=row.title,
            status=row.status,
            expires_at=row.expires_at,
            days_until_expiry=_job_days_until_expiry(row.expires_at),
            total_applications=row.total_applications or 0,
            applied_count=row.applied_count or 0,
            screening_count=row.screening_count or 0,
            shortlisted_count=row.shortlisted_count or 0,
            rejected_count=row.rejected_count or 0,
        )
        for row in result.all()
    ]


async def _get_todays_interviews(
    db: AsyncSession, company_id: uuid.UUID
) -> list[TodayInterview]:
    result = await db.execute(
        select(
            Interview.id.label("interview_id"),
            Interview.application_id,
            Interview.candidate_name,
            Interview.candidate_email,
            Interview.start_time,
            Job.title.label("job_title"),
            Application.status.label("application_status"),
        )
        .join(Application, Application.id == Interview.application_id)
        .join(Job, Job.id == Application.job_id)
        .where(
            Job.company_id == company_id,
            func.date(Interview.start_time) == _today_utc(),
        )
        .order_by(Interview.start_time.asc())
    )

    return [TodayInterview.model_validate(row._mapping) for row in result.all()]


async def _get_pending_drafts(
    db: AsyncSession, company_id: uuid.UUID
) -> list[PendingDraftItem]:
    result = await db.execute(
        select(
            EmailDraft.id.label("draft_id"),
            Application.id.label("application_id"),
            Application.status.label("application_status"),
            Application.user_id,
            User.full_name.label("candidate_name"),
            Job.title.label("job_title"),
            EmailDraft.subject,
        )
        .join(Application, Application.id == EmailDraft.application_id)
        .join(User, User.id == Application.user_id)
        .join(Job, Job.id == Application.job_id)
        .where(
            Job.company_id == company_id,
            EmailDraft.is_sent.is_(False),
            EmailDraft.is_discarded.is_(False),
        )
        .order_by(EmailDraft.updated_at.desc(), EmailDraft.created_at.desc())
        .limit(10)
    )

    drafts: list[PendingDraftItem] = []
    for row in result.all():
        drafts.append(
            PendingDraftItem(
                draft_id=row.draft_id,
                application_id=row.application_id,
                candidate_name=row.candidate_name,
                job_title=row.job_title,
                email_type=_draft_email_type(row.application_status),
                subject=row.subject or f"Update on your {row.job_title} application",
            )
        )
    return drafts


async def get_recruiter_dashboard(
    db: AsyncSession, current_user: User
) -> RecruiterDashboardResponse:
    cache_key = f"dashboard:recruiter:{current_user.id}"
    cached_data = await redis_service.get(cache_key)
    if cached_data:
        return RecruiterDashboardResponse.model_validate_json(cached_data)

    company_id, company_name = await _get_company_context(db, current_user.id)
    if company_id is None:
        response = RecruiterDashboardResponse(
            company_name="",
            recruiter_name=current_user.full_name,
            stats=RecruiterStats(
                active_jobs=0,
                total_applications=0,
                shortlisted=0,
                interviews_today=0,
                pending_drafts=0,
            ),
            active_jobs=[],
            todays_interviews=[],
            pending_drafts=[],
        )
        await redis_service.set(cache_key, response.model_dump_json(), ttl_seconds=300)
        return response

    response = RecruiterDashboardResponse(
        company_name=company_name,
        recruiter_name=current_user.full_name,
        stats=await _get_recruiter_stats(db, company_id),
        active_jobs=await _get_active_jobs(db, company_id),
        todays_interviews=await _get_todays_interviews(db, company_id),
        pending_drafts=await _get_pending_drafts(db, company_id),
    )
    await redis_service.set(cache_key, response.model_dump_json(), ttl_seconds=300)
    return response


async def _get_join_requests(
    db: AsyncSession, company_id: uuid.UUID
) -> list[JoinRequestItem]:
    result = await db.execute(
        select(
            CompanyMembership.id.label("membership_id"),
            User.full_name.label("recruiter_name"),
            User.email.label("recruiter_email"),
            CompanyMembership.created_at.label("requested_at"),
        )
        .join(User, User.id == CompanyMembership.user_id)
        .where(
            CompanyMembership.company_id == company_id,
            CompanyMembership.status == MembershipStatus.pending,
        )
        .order_by(CompanyMembership.created_at.asc())
    )
    return [JoinRequestItem.model_validate(row._mapping) for row in result.all()]


async def _get_team_activity(
    db: AsyncSession, company_id: uuid.UUID
) -> list[TeamMemberActivity]:
    month_start = _utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    shortlist_count = await db.scalar(
        select(func.count(Application.id))
        .join(Job, Job.id == Application.job_id)
        .where(
            Job.company_id == company_id,
            Application.status == ApplicationStatus.shortlisted,
            Application.updated_at >= month_start,
        )
    )
    interview_count = await db.scalar(
        select(func.count(Interview.id))
        .join(Application, Application.id == Interview.application_id)
        .join(Job, Job.id == Application.job_id)
        .where(
            Job.company_id == company_id,
            Interview.start_time >= month_start,
        )
    )

    memberships_result = await db.execute(
        select(
            CompanyMembership.id.label("membership_id"),
            User.full_name.label("recruiter_name"),
            CompanyMembership.status.label("membership_status"),
        )
        .join(User, User.id == CompanyMembership.user_id)
        .where(
            CompanyMembership.company_id == company_id,
            CompanyMembership.status.in_(
                [MembershipStatus.active, MembershipStatus.pending]
            ),
        )
        .order_by(
            case((CompanyMembership.status == MembershipStatus.active, 0), else_=1),
            User.full_name.asc(),
        )
    )
    membership_rows = memberships_result.all()

    active_count = sum(
        1 for row in membership_rows if row.membership_status == MembershipStatus.active
    )
    per_member_shortlists = (
        round((shortlist_count or 0) / active_count) if active_count > 0 else 0
    )
    per_member_interviews = (
        round((interview_count or 0) / active_count) if active_count > 0 else 0
    )

    team_activity: list[TeamMemberActivity] = []
    for row in membership_rows:
        is_active = row.membership_status == MembershipStatus.active
        team_activity.append(
            TeamMemberActivity(
                membership_id=row.membership_id,
                recruiter_name=row.recruiter_name,
                membership_status=row.membership_status,
                shortlisted_this_month=per_member_shortlists if is_active else 0,
                interviews_this_month=per_member_interviews if is_active else 0,
            )
        )
    return team_activity


async def get_recruiter_admin_dashboard(
    db: AsyncSession, current_user: User
) -> RecruiterAdminDashboardResponse:
    cache_key = f"dashboard:recruiter-admin:{current_user.id}"
    cached_data = await redis_service.get(cache_key)
    if cached_data:
        return RecruiterAdminDashboardResponse.model_validate_json(cached_data)

    company_id, company_name = await _get_company_context(db, current_user.id)
    if company_id is None:
        response = RecruiterAdminDashboardResponse(
            company_name="",
            recruiter_name=current_user.full_name,
            stats=RecruiterAdminStats(
                active_jobs=0,
                total_applications=0,
                shortlisted=0,
                interviews_today=0,
                pending_drafts=0,
                pending_join_requests=0,
            ),
            active_jobs=[],
            todays_interviews=[],
            pending_drafts=[],
            join_requests=[],
            team_activity=[],
        )
        await redis_service.set(cache_key, response.model_dump_json(), ttl_seconds=300)
        return response

    base_stats = await _get_recruiter_stats(db, company_id)
    join_requests = await _get_join_requests(db, company_id)
    response = RecruiterAdminDashboardResponse(
        company_name=company_name,
        recruiter_name=current_user.full_name,
        stats=RecruiterAdminStats(
            active_jobs=base_stats.active_jobs,
            total_applications=base_stats.total_applications,
            shortlisted=base_stats.shortlisted,
            interviews_today=base_stats.interviews_today,
            pending_drafts=base_stats.pending_drafts,
            pending_join_requests=len(join_requests),
        ),
        active_jobs=await _get_active_jobs(db, company_id),
        todays_interviews=await _get_todays_interviews(db, company_id),
        pending_drafts=await _get_pending_drafts(db, company_id),
        join_requests=join_requests,
        team_activity=await _get_team_activity(db, company_id),
    )
    await redis_service.set(cache_key, response.model_dump_json(), ttl_seconds=300)
    return response

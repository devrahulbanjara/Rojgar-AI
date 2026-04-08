from __future__ import annotations

from collections import defaultdict
import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.companies.models import Company, CompanyMembership
from app.infrastructures.redis.service import redis_service
from app.modules.applications.models import Application
from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.dashboards.schemas import (
    ApplicationPipelineItem,
    CandidateAnalyticsStats,
    CandidateAnalyticsTimeseriesPoint,
    CandidateAnalyticsVelocity,
    CandidateDashboardAnalyticsResponse,
    CandidateInterviewItem,
    CandidateDashboardResponse,
    CandidateStats,
    InterviewLoadPoint,
    JoinRequestItem,
    JoinRequestTimeseriesPoint,
    JobPipelineItem,
    JobHealthPoint,
    MembershipBreakdownPoint,
    OutreachStateBreakdown,
    PendingDraftItem,
    RecruiterAdminAnalyticsStats,
    RecruiterAdminDashboardAnalyticsResponse,
    RecruiterAdminDashboardResponse,
    RecruiterAdminStats,
    RecruiterAnalyticsStats,
    RecruiterAnalyticsTimeseriesPoint,
    RecruiterAnalyticsVelocity,
    RecruiterDashboardAnalyticsResponse,
    RecruiterDashboardResponse,
    RecruiterOutreachSummary,
    RecruiterStats,
    ScoreDistribution,
    ScoreDistributionBucket,
    StageCountPoint,
    TeamMemberActivity,
    TodayInterview,
)
from app.modules.interviews.models import Interview
from app.modules.jobs.models import Job
from app.modules.outreach.models import EmailDraft
from app.modules.profiles.models import Profile
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

ANALYTICS_RANGE_DAYS = {"7d": 7, "30d": 30, "90d": 90}

SHORTLIST_RELATED_STATUSES = {
    ApplicationStatus.shortlisted,
    ApplicationStatus.interview_booked,
    ApplicationStatus.interview_completed,
    ApplicationStatus.offer,
}

INTERVIEW_RELATED_STATUSES = {
    ApplicationStatus.interview_booked,
    ApplicationStatus.interview_completed,
    ApplicationStatus.offer,
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


def _normalize_range_key(range_key: str) -> str:
    return range_key if range_key in ANALYTICS_RANGE_DAYS else "30d"


def _analytics_window(range_key: str) -> tuple[str, datetime, date, date]:
    normalized = _normalize_range_key(range_key)
    end_date = _today_utc()
    start_date = end_date - timedelta(days=ANALYTICS_RANGE_DAYS[normalized] - 1)
    start_dt = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)
    return normalized, start_dt, start_date, end_date


def _date_sequence(start_date: date, end_date: date) -> list[date]:
    days = (end_date - start_date).days
    return [start_date + timedelta(days=index) for index in range(days + 1)]


def _round_days(value: float | None) -> float | None:
    if value is None:
        return None
    return round(value, 1)


def _average_duration_days(rows: list[tuple[datetime, datetime]]) -> float | None:
    if not rows:
        return None
    total_days = sum(
        (updated_at - created_at).total_seconds() / 86400
        for created_at, updated_at in rows
        if created_at and updated_at
    )
    return _round_days(total_days / len(rows))


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
        )
        for row in application_rows.all()
    ]

    interview_rows = await db.execute(
        select(
            Interview.id.label("interview_id"),
            Interview.application_id,
            Application.job_id,
            Job.title.label("job_title"),
            Company.name.label("company_name"),
            Company.logo_url.label("company_logo_url"),
            Interview.start_time,
            Interview.end_time,
            Interview.location,
            Interview.title,
            Application.status.label("application_status"),
        )
        .join(Application, Application.id == Interview.application_id)
        .join(Job, Job.id == Application.job_id)
        .join(Company, Company.id == Job.company_id)
        .where(
            Application.user_id == current_user.id,
            Application.status == ApplicationStatus.interview_booked,
        )
        .order_by(Interview.start_time.asc())
        .limit(8)
    )

    interviews = [
        CandidateInterviewItem(
            interview_id=row.interview_id,
            application_id=row.application_id,
            job_id=row.job_id,
            job_title=row.job_title,
            company_name=row.company_name,
            company_logo_url=row.company_logo_url,
            start_time=row.start_time,
            end_time=row.end_time,
            location=row.location,
            title=row.title,
            application_status=row.application_status,
        )
        for row in interview_rows.all()
    ]

    response = CandidateDashboardResponse(
        user_name=current_user.full_name,
        is_open_to_work=is_open_to_work,
        stats=stats,
        applications=applications,
        interviews=interviews,
    )
    await redis_service.set(cache_key, response.model_dump_json(), ttl_seconds=300)
    return response


async def get_candidate_dashboard_analytics(
    db: AsyncSession, current_user: User, range_key: str
) -> CandidateDashboardAnalyticsResponse:
    normalized_range, start_dt, start_date, end_date = _analytics_window(range_key)
    cache_key = f"dashboard:candidate:{current_user.id}:analytics:{normalized_range}"
    cached_data = await redis_service.get(cache_key)
    if cached_data:
        return CandidateDashboardAnalyticsResponse.model_validate_json(cached_data)

    stats_row = (
        await db.execute(
            select(
                func.count(Application.id).label("total_applications"),
                func.sum(
                    case(
                        (Application.status == ApplicationStatus.screening, 1), else_=0
                    )
                ).label("screening"),
                func.sum(
                    case(
                        (Application.status == ApplicationStatus.shortlisted, 1),
                        else_=0,
                    )
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
                ).label("interviews"),
                func.sum(
                    case((Application.status == ApplicationStatus.offer, 1), else_=0)
                ).label("offers"),
                func.sum(
                    case((Application.status == ApplicationStatus.rejected, 1), else_=0)
                ).label("rejected"),
            ).where(Application.user_id == current_user.id)
        )
    ).one()

    stats = CandidateAnalyticsStats(
        total_applications=stats_row.total_applications or 0,
        screening=stats_row.screening or 0,
        shortlisted=stats_row.shortlisted or 0,
        interviews=stats_row.interviews or 0,
        offers=stats_row.offers or 0,
        rejected=stats_row.rejected or 0,
    )

    activity_rows = (
        await db.execute(
            select(
                Application.created_at, Application.updated_at, Application.status
            ).where(
                Application.user_id == current_user.id,
                (Application.created_at >= start_dt)
                | (Application.updated_at >= start_dt),
            )
        )
    ).all()

    timeseries_by_date: dict[date, dict[str, int]] = {
        day: {
            "applications": 0,
            "shortlisted": 0,
            "interviews": 0,
            "offers": 0,
            "rejected": 0,
        }
        for day in _date_sequence(start_date, end_date)
    }

    for row in activity_rows:
        created_day = row.created_at.date()
        if created_day in timeseries_by_date:
            timeseries_by_date[created_day]["applications"] += 1

        updated_day = row.updated_at.date()
        if updated_day not in timeseries_by_date:
            continue

        if row.status == ApplicationStatus.shortlisted:
            timeseries_by_date[updated_day]["shortlisted"] += 1
        elif row.status in {
            ApplicationStatus.interview_booked,
            ApplicationStatus.interview_completed,
        }:
            timeseries_by_date[updated_day]["interviews"] += 1
        elif row.status == ApplicationStatus.offer:
            timeseries_by_date[updated_day]["offers"] += 1
        elif row.status == ApplicationStatus.rejected:
            timeseries_by_date[updated_day]["rejected"] += 1

    timeseries = [
        CandidateAnalyticsTimeseriesPoint(
            date=day,
            applications=values["applications"],
            shortlisted=values["shortlisted"],
            interviews=values["interviews"],
            offers=values["offers"],
            rejected=values["rejected"],
        )
        for day, values in timeseries_by_date.items()
    ]

    shortlist_rows = (
        await db.execute(
            select(Application.created_at, Application.updated_at).where(
                Application.user_id == current_user.id,
                Application.status.in_(tuple(SHORTLIST_RELATED_STATUSES)),
            )
        )
    ).all()
    interview_rows = (
        await db.execute(
            select(Application.created_at, Application.updated_at).where(
                Application.user_id == current_user.id,
                Application.status.in_(tuple(INTERVIEW_RELATED_STATUSES)),
            )
        )
    ).all()
    offer_rows = (
        await db.execute(
            select(Application.created_at, Application.updated_at).where(
                Application.user_id == current_user.id,
                Application.status == ApplicationStatus.offer,
            )
        )
    ).all()

    response = CandidateDashboardAnalyticsResponse(
        range_key=normalized_range,
        stats=stats,
        funnel=[
            StageCountPoint(stage="applied", count=stats.total_applications),
            StageCountPoint(stage="screening", count=stats.screening),
            StageCountPoint(stage="shortlisted", count=stats.shortlisted),
            StageCountPoint(stage="interview", count=stats.interviews),
            StageCountPoint(stage="offer", count=stats.offers),
            StageCountPoint(stage="rejected", count=stats.rejected),
        ],
        timeseries=timeseries,
        velocity=CandidateAnalyticsVelocity(
            avg_days_to_shortlist=_average_duration_days(
                [(row.created_at, row.updated_at) for row in shortlist_rows]
            ),
            avg_days_to_interview=_average_duration_days(
                [(row.created_at, row.updated_at) for row in interview_rows]
            ),
            avg_days_to_offer=_average_duration_days(
                [(row.created_at, row.updated_at) for row in offer_rows]
            ),
        ),
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


async def _get_recruiter_analytics_stats(
    db: AsyncSession, company_id: uuid.UUID
) -> RecruiterAnalyticsStats:
    stats_row = (
        await db.execute(
            select(
                func.count(func.distinct(Job.id))
                .filter(Job.status == JobStatus.active)
                .label("active_jobs"),
                func.count(func.distinct(Application.id)).label("applications"),
                func.count(func.distinct(Application.id))
                .filter(Application.status == ApplicationStatus.screening)
                .label("screening"),
                func.count(func.distinct(Application.id))
                .filter(Application.status == ApplicationStatus.shortlisted)
                .label("shortlisted"),
                func.count(func.distinct(Application.id))
                .filter(Application.status == ApplicationStatus.interview_booked)
                .label("interview_booked"),
                func.count(func.distinct(Application.id))
                .filter(Application.status == ApplicationStatus.interview_completed)
                .label("interview_completed"),
                func.count(func.distinct(Application.id))
                .filter(Application.status == ApplicationStatus.offer)
                .label("offers"),
                func.count(func.distinct(EmailDraft.id))
                .filter(
                    EmailDraft.is_sent.is_(False),
                    EmailDraft.is_discarded.is_(False),
                )
                .label("pending_drafts"),
            )
            .select_from(Job)
            .outerjoin(Application, Application.job_id == Job.id)
            .outerjoin(EmailDraft, EmailDraft.application_id == Application.id)
            .where(Job.company_id == company_id)
        )
    ).one()

    return RecruiterAnalyticsStats(
        active_jobs=stats_row.active_jobs or 0,
        applications=stats_row.applications or 0,
        screening=stats_row.screening or 0,
        shortlisted=stats_row.shortlisted or 0,
        interview_booked=stats_row.interview_booked or 0,
        interview_completed=stats_row.interview_completed or 0,
        offers=stats_row.offers or 0,
        pending_drafts=stats_row.pending_drafts or 0,
    )


async def _get_recruiter_applications_timeseries(
    db: AsyncSession,
    company_id: uuid.UUID,
    start_dt: datetime,
    start_date: date,
    end_date: date,
) -> list[RecruiterAnalyticsTimeseriesPoint]:
    application_rows = (
        await db.execute(
            select(
                Application.created_at,
                Application.updated_at,
                Application.score,
                Application.feedback,
            )
            .join(Job, Job.id == Application.job_id)
            .where(
                Job.company_id == company_id,
                (Application.created_at >= start_dt)
                | (Application.updated_at >= start_dt),
            )
        )
    ).all()

    interview_rows = (
        await db.execute(
            select(Interview.created_at)
            .join(Application, Application.id == Interview.application_id)
            .join(Job, Job.id == Application.job_id)
            .where(Job.company_id == company_id, Interview.created_at >= start_dt)
        )
    ).all()

    timeseries_by_date: dict[date, dict[str, int]] = {
        day: {
            "new_applicants": 0,
            "completed_reviews": 0,
            "interviews_scheduled": 0,
        }
        for day in _date_sequence(start_date, end_date)
    }

    for row in application_rows:
        created_day = row.created_at.date()
        if created_day in timeseries_by_date:
            timeseries_by_date[created_day]["new_applicants"] += 1

        updated_day = row.updated_at.date()
        if (
            updated_day in timeseries_by_date
            and row.score is not None
            and bool((row.feedback or "").strip())
        ):
            timeseries_by_date[updated_day]["completed_reviews"] += 1

    for row in interview_rows:
        created_day = row.created_at.date()
        if created_day in timeseries_by_date:
            timeseries_by_date[created_day]["interviews_scheduled"] += 1

    return [
        RecruiterAnalyticsTimeseriesPoint(
            date=day,
            new_applicants=values["new_applicants"],
            completed_reviews=values["completed_reviews"],
            interviews_scheduled=values["interviews_scheduled"],
        )
        for day, values in timeseries_by_date.items()
    ]


async def _get_recruiter_interview_load(
    db: AsyncSession, company_id: uuid.UUID
) -> list[InterviewLoadPoint]:
    load_start = _today_utc()
    load_end = load_start + timedelta(days=13)
    interview_rows = (
        await db.execute(
            select(Interview.start_time)
            .join(Application, Application.id == Interview.application_id)
            .join(Job, Job.id == Application.job_id)
            .where(
                Job.company_id == company_id,
                Interview.start_time
                >= datetime.combine(
                    load_start, datetime.min.time(), tzinfo=timezone.utc
                ),
                Interview.start_time
                < datetime.combine(
                    load_end + timedelta(days=1),
                    datetime.min.time(),
                    tzinfo=timezone.utc,
                ),
            )
        )
    ).all()

    counts: defaultdict[date, int] = defaultdict(int)
    for row in interview_rows:
        counts[row.start_time.date()] += 1

    return [
        InterviewLoadPoint(date=day, count=counts.get(day, 0))
        for day in _date_sequence(load_start, load_end)
    ]


async def _get_score_distribution(
    db: AsyncSession, company_id: uuid.UUID
) -> ScoreDistribution:
    score_rows = (
        await db.execute(
            select(Application.score)
            .join(Job, Job.id == Application.job_id)
            .where(Job.company_id == company_id, Application.score.is_not(None))
        )
    ).all()

    buckets = {
        "0-24": 0,
        "25-49": 0,
        "50-69": 0,
        "70-84": 0,
        "85-100": 0,
    }

    for row in score_rows:
        score = row.score or 0
        if score < 25:
            buckets["0-24"] += 1
        elif score < 50:
            buckets["25-49"] += 1
        elif score < 70:
            buckets["50-69"] += 1
        elif score < 85:
            buckets["70-84"] += 1
        else:
            buckets["85-100"] += 1

    return ScoreDistribution(
        buckets=[
            ScoreDistributionBucket(label=label, count=count)
            for label, count in buckets.items()
        ]
    )


async def _get_job_health_points(
    db: AsyncSession, company_id: uuid.UUID
) -> list[JobHealthPoint]:
    job_rows = (
        await db.execute(
            select(
                Job.id.label("job_id"),
                Job.title.label("job_title"),
                Job.expires_at,
                func.count(Application.id).label("applications"),
                func.sum(
                    case(
                        (
                            Application.status.in_(tuple(SHORTLIST_RELATED_STATUSES)),
                            1,
                        ),
                        else_=0,
                    )
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
                ).label("interviews"),
                func.sum(
                    case((Application.status == ApplicationStatus.offer, 1), else_=0)
                ).label("offers"),
            )
            .select_from(Job)
            .outerjoin(Application, Application.job_id == Job.id)
            .where(Job.company_id == company_id, Job.status == JobStatus.active)
            .group_by(Job.id)
            .order_by(Job.expires_at.asc().nulls_last(), Job.created_at.asc())
            .limit(8)
        )
    ).all()

    return [
        JobHealthPoint(
            job_id=row.job_id,
            job_title=row.job_title,
            days_until_expiry=_job_days_until_expiry(row.expires_at),
            applications=row.applications or 0,
            shortlisted=row.shortlisted or 0,
            interviews=row.interviews or 0,
            offers=row.offers or 0,
        )
        for row in job_rows
    ]


async def _get_outreach_summary(
    db: AsyncSession, company_id: uuid.UUID
) -> RecruiterOutreachSummary:
    draft_rows = (
        await db.execute(
            select(
                Application.status,
                EmailDraft.is_approved,
                EmailDraft.is_sent,
                EmailDraft.is_discarded,
            )
            .join(Application, Application.id == EmailDraft.application_id)
            .join(Job, Job.id == Application.job_id)
            .where(Job.company_id == company_id)
        )
    ).all()

    counts = {
        "shortlist": {"drafted": 0, "approved": 0, "sent": 0, "discarded": 0},
        "rejection": {"drafted": 0, "approved": 0, "sent": 0, "discarded": 0},
    }

    for row in draft_rows:
        email_type = _draft_email_type(row.status)
        if row.is_discarded:
            counts[email_type]["discarded"] += 1
        elif row.is_sent:
            counts[email_type]["sent"] += 1
        elif row.is_approved:
            counts[email_type]["approved"] += 1
        else:
            counts[email_type]["drafted"] += 1

    return RecruiterOutreachSummary(
        shortlist=OutreachStateBreakdown(**counts["shortlist"]),
        rejection=OutreachStateBreakdown(**counts["rejection"]),
    )


async def _get_recruiter_velocity(
    db: AsyncSession, company_id: uuid.UUID
) -> RecruiterAnalyticsVelocity:
    rows = (
        await db.execute(
            select(
                Application.created_at,
                Application.updated_at,
                Application.score,
                Application.feedback,
                Application.status,
            )
            .join(Job, Job.id == Application.job_id)
            .where(Job.company_id == company_id)
        )
    ).all()

    review_rows: list[tuple[datetime, datetime]] = []
    shortlist_rows: list[tuple[datetime, datetime]] = []
    interview_rows: list[tuple[datetime, datetime]] = []

    for row in rows:
        if row.score is not None and bool((row.feedback or "").strip()):
            review_rows.append((row.created_at, row.updated_at))
        if row.status in SHORTLIST_RELATED_STATUSES:
            shortlist_rows.append((row.created_at, row.updated_at))
        if row.status in INTERVIEW_RELATED_STATUSES:
            interview_rows.append((row.created_at, row.updated_at))

    return RecruiterAnalyticsVelocity(
        avg_days_to_review=_average_duration_days(review_rows),
        avg_days_to_shortlist=_average_duration_days(shortlist_rows),
        avg_days_to_interview=_average_duration_days(interview_rows),
    )


async def get_recruiter_dashboard_analytics(
    db: AsyncSession, current_user: User, range_key: str
) -> RecruiterDashboardAnalyticsResponse:
    normalized_range, start_dt, start_date, end_date = _analytics_window(range_key)
    cache_key = f"dashboard:recruiter:{current_user.id}:analytics:{normalized_range}"
    cached_data = await redis_service.get(cache_key)
    if cached_data:
        return RecruiterDashboardAnalyticsResponse.model_validate_json(cached_data)

    company_id, _company_name = await _get_company_context(db, current_user.id)
    if company_id is None:
        response = RecruiterDashboardAnalyticsResponse(
            range_key=normalized_range,
            stats=RecruiterAnalyticsStats(
                active_jobs=0,
                applications=0,
                screening=0,
                shortlisted=0,
                interview_booked=0,
                interview_completed=0,
                offers=0,
                pending_drafts=0,
            ),
            funnel=[],
            applications_timeseries=[],
            interview_load=[],
            score_distribution=ScoreDistribution(buckets=[]),
            job_health=[],
            outreach=RecruiterOutreachSummary(
                shortlist=OutreachStateBreakdown(
                    drafted=0, approved=0, sent=0, discarded=0
                ),
                rejection=OutreachStateBreakdown(
                    drafted=0, approved=0, sent=0, discarded=0
                ),
            ),
            velocity=RecruiterAnalyticsVelocity(),
        )
        await redis_service.set(cache_key, response.model_dump_json(), ttl_seconds=300)
        return response

    stats = await _get_recruiter_analytics_stats(db, company_id)
    response = RecruiterDashboardAnalyticsResponse(
        range_key=normalized_range,
        stats=stats,
        funnel=[
            StageCountPoint(stage="applied", count=stats.applications),
            StageCountPoint(stage="screening", count=stats.screening),
            StageCountPoint(stage="shortlisted", count=stats.shortlisted),
            StageCountPoint(stage="interview_booked", count=stats.interview_booked),
            StageCountPoint(
                stage="interview_completed", count=stats.interview_completed
            ),
            StageCountPoint(stage="offer", count=stats.offers),
        ],
        applications_timeseries=await _get_recruiter_applications_timeseries(
            db, company_id, start_dt, start_date, end_date
        ),
        interview_load=await _get_recruiter_interview_load(db, company_id),
        score_distribution=await _get_score_distribution(db, company_id),
        job_health=await _get_job_health_points(db, company_id),
        outreach=await _get_outreach_summary(db, company_id),
        velocity=await _get_recruiter_velocity(db, company_id),
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
    memberships_result = await db.execute(
        select(
            CompanyMembership.id.label("membership_id"),
            CompanyMembership.user_id.label("user_id"),
            User.full_name.label("recruiter_name"),
            CompanyMembership.status.label("membership_status"),
        )
        .join(User, User.id == CompanyMembership.user_id)
        .where(
            CompanyMembership.company_id == company_id,
            CompanyMembership.status.in_(
                [
                    MembershipStatus.active,
                    MembershipStatus.pending,
                    MembershipStatus.rejected,
                ]
            ),
        )
        .order_by(
            case((CompanyMembership.status == MembershipStatus.active, 0), else_=1),
            User.full_name.asc(),
        )
    )
    membership_rows = memberships_result.all()

    active_job_rows = (
        await db.execute(
            select(
                Job.posted_by.label("user_id"),
                func.count(Job.id).label("active_jobs"),
            )
            .where(
                Job.company_id == company_id,
                Job.posted_by.is_not(None),
                Job.status == JobStatus.active,
            )
            .group_by(Job.posted_by)
        )
    ).all()
    shortlisted_rows = (
        await db.execute(
            select(
                Job.posted_by.label("user_id"),
                func.count(Application.id).label("shortlisted_this_month"),
            )
            .join(Application, Application.job_id == Job.id)
            .where(
                Job.company_id == company_id,
                Job.posted_by.is_not(None),
                Application.status == ApplicationStatus.shortlisted,
                Application.updated_at >= month_start,
            )
            .group_by(Job.posted_by)
        )
    ).all()
    interview_rows = (
        await db.execute(
            select(
                Job.posted_by.label("user_id"),
                func.count(Interview.id).label("interviews_this_month"),
            )
            .join(Application, Application.job_id == Job.id)
            .join(Interview, Interview.application_id == Application.id)
            .where(
                Job.company_id == company_id,
                Job.posted_by.is_not(None),
                Interview.start_time >= month_start,
            )
            .group_by(Job.posted_by)
        )
    ).all()

    active_jobs_by_user = {
        row.user_id: row.active_jobs or 0
        for row in active_job_rows
        if row.user_id is not None
    }
    shortlisted_by_user = {
        row.user_id: row.shortlisted_this_month or 0
        for row in shortlisted_rows
        if row.user_id is not None
    }
    interviews_by_user = {
        row.user_id: row.interviews_this_month or 0
        for row in interview_rows
        if row.user_id is not None
    }

    team_activity: list[TeamMemberActivity] = []
    for row in membership_rows:
        is_active = row.membership_status == MembershipStatus.active
        team_activity.append(
            TeamMemberActivity(
                membership_id=row.membership_id,
                recruiter_name=row.recruiter_name,
                membership_status=row.membership_status,
                active_jobs=active_jobs_by_user.get(row.user_id, 0) if is_active else 0,
                shortlisted_this_month=shortlisted_by_user.get(row.user_id, 0)
                if is_active
                else 0,
                interviews_this_month=interviews_by_user.get(row.user_id, 0)
                if is_active
                else 0,
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


async def _get_membership_breakdown(
    db: AsyncSession, company_id: uuid.UUID
) -> list[MembershipBreakdownPoint]:
    rows = (
        await db.execute(
            select(
                CompanyMembership.status,
                func.count(CompanyMembership.id).label("count"),
            )
            .where(CompanyMembership.company_id == company_id)
            .group_by(CompanyMembership.status)
        )
    ).all()

    counts = {
        MembershipStatus.active: 0,
        MembershipStatus.pending: 0,
        MembershipStatus.rejected: 0,
    }
    for row in rows:
        counts[row.status] = row.count or 0

    return [
        MembershipBreakdownPoint(status=status, count=count)
        for status, count in counts.items()
    ]


async def _get_join_request_timeseries(
    db: AsyncSession,
    company_id: uuid.UUID,
    start_dt: datetime,
    start_date: date,
    end_date: date,
) -> list[JoinRequestTimeseriesPoint]:
    rows = (
        await db.execute(
            select(
                CompanyMembership.created_at,
                CompanyMembership.updated_at,
                CompanyMembership.status,
            ).where(
                CompanyMembership.company_id == company_id,
                (CompanyMembership.created_at >= start_dt)
                | (CompanyMembership.updated_at >= start_dt),
            )
        )
    ).all()

    by_date: dict[date, dict[str, int]] = {
        day: {"requested": 0, "approved": 0, "rejected": 0}
        for day in _date_sequence(start_date, end_date)
    }

    for row in rows:
        created_day = row.created_at.date()
        if created_day in by_date:
            by_date[created_day]["requested"] += 1

        updated_day = row.updated_at.date()
        if updated_day not in by_date:
            continue

        if row.status == MembershipStatus.active:
            by_date[updated_day]["approved"] += 1
        elif row.status == MembershipStatus.rejected:
            by_date[updated_day]["rejected"] += 1

    return [
        JoinRequestTimeseriesPoint(
            date=day,
            requested=values["requested"],
            approved=values["approved"],
            rejected=values["rejected"],
        )
        for day, values in by_date.items()
    ]


async def get_recruiter_admin_dashboard_analytics(
    db: AsyncSession, current_user: User, range_key: str
) -> RecruiterAdminDashboardAnalyticsResponse:
    normalized_range, start_dt, start_date, end_date = _analytics_window(range_key)
    cache_key = (
        f"dashboard:recruiter-admin:{current_user.id}:analytics:{normalized_range}"
    )
    cached_data = await redis_service.get(cache_key)
    if cached_data:
        return RecruiterAdminDashboardAnalyticsResponse.model_validate_json(cached_data)

    company_id, _company_name = await _get_company_context(db, current_user.id)
    if company_id is None:
        response = RecruiterAdminDashboardAnalyticsResponse(
            range_key=normalized_range,
            stats=RecruiterAdminAnalyticsStats(
                active_jobs=0,
                applications=0,
                shortlisted=0,
                interviews=0,
                offers=0,
                pending_join_requests=0,
                active_recruiters=0,
            ),
            company_funnel=[],
            join_request_timeseries=[],
            membership_breakdown=[],
            team_activity=[],
            portfolio_health=[],
            velocity=RecruiterAnalyticsVelocity(),
        )
        await redis_service.set(cache_key, response.model_dump_json(), ttl_seconds=300)
        return response

    recruiter_stats = await _get_recruiter_analytics_stats(db, company_id)
    membership_breakdown = await _get_membership_breakdown(db, company_id)
    active_recruiters = next(
        (
            item.count
            for item in membership_breakdown
            if item.status == MembershipStatus.active
        ),
        0,
    )
    pending_join_requests = next(
        (
            item.count
            for item in membership_breakdown
            if item.status == MembershipStatus.pending
        ),
        0,
    )

    response = RecruiterAdminDashboardAnalyticsResponse(
        range_key=normalized_range,
        stats=RecruiterAdminAnalyticsStats(
            active_jobs=recruiter_stats.active_jobs,
            applications=recruiter_stats.applications,
            shortlisted=recruiter_stats.shortlisted,
            interviews=recruiter_stats.interview_booked
            + recruiter_stats.interview_completed,
            offers=recruiter_stats.offers,
            pending_join_requests=pending_join_requests,
            active_recruiters=active_recruiters,
        ),
        company_funnel=[
            StageCountPoint(stage="applied", count=recruiter_stats.applications),
            StageCountPoint(stage="screening", count=recruiter_stats.screening),
            StageCountPoint(stage="shortlisted", count=recruiter_stats.shortlisted),
            StageCountPoint(
                stage="interview_booked", count=recruiter_stats.interview_booked
            ),
            StageCountPoint(
                stage="interview_completed",
                count=recruiter_stats.interview_completed,
            ),
            StageCountPoint(stage="offer", count=recruiter_stats.offers),
        ],
        join_request_timeseries=await _get_join_request_timeseries(
            db, company_id, start_dt, start_date, end_date
        ),
        membership_breakdown=membership_breakdown,
        team_activity=await _get_team_activity(db, company_id),
        portfolio_health=await _get_job_health_points(db, company_id),
        velocity=await _get_recruiter_velocity(db, company_id),
    )
    await redis_service.set(cache_key, response.model_dump_json(), ttl_seconds=300)
    return response

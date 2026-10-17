from __future__ import annotations

import uuid
from collections import defaultdict
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import case, exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.swr_cache import swr_get
from app.modules.applications.models import Application, ApplicationEvent, Review
from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership
from app.modules.dashboards.schemas import (
    ApplicationPipelineItem,
    CandidateAnalyticsStats,
    CandidateAnalyticsTimeseriesPoint,
    CandidateAnalyticsVelocity,
    CandidateDashboardAnalyticsResponse,
    CandidateDashboardResponse,
    CandidateInterviewItem,
    FitDistribution,
    FitDistributionBucket,
    InterviewLoadPoint,
    JobPipelineItem,
    RecruiterAnalyticsStats,
    RecruiterAnalyticsTimeseriesPoint,
    RecruiterAnalyticsVelocity,
    RecruiterDashboardAnalyticsResponse,
    RecruiterDashboardResponse,
    RecruiterStats,
    StageCountPoint,
    TodayInterview,
)
from app.modules.interviews.models import Interview
from app.modules.jobs.models import Job
from app.modules.profiles.models import Profile
from app.shared.enums import ApplicationStage, EventType, Fit, JobStatus, ReviewState

PIPELINE_STEPS: dict[ApplicationStage, int | None] = {
    ApplicationStage.new: 1,
    ApplicationStage.shortlisted: 2,
    ApplicationStage.interview: 3,
    ApplicationStage.offer: 4,
    ApplicationStage.rejected: None,
}

ANALYTICS_RANGE_DAYS = {"7d": 7, "30d": 30, "90d": 90}

SHORTLIST_RELATED_STAGES = {
    ApplicationStage.shortlisted,
    ApplicationStage.interview,
    ApplicationStage.offer,
}

INTERVIEW_RELATED_STAGES = {
    ApplicationStage.interview,
    ApplicationStage.offer,
}

# An interview counts as done once an `interview_done` event exists.
_INTERVIEW_DONE = exists().where(
    ApplicationEvent.application_id == Application.id,
    ApplicationEvent.type == EventType.interview_done.value,
)


def _utcnow() -> datetime:
    """Return the current UTC datetime."""
    return datetime.now(UTC)


def _today_utc() -> date:
    """Return today's date in UTC."""
    return _utcnow().date()


def _pipeline_step(stage: ApplicationStage) -> int | None:
    """Map an application stage to its dashboard pipeline step."""
    return PIPELINE_STEPS.get(stage)


def _job_days_until_expiry(expires_at: datetime | None) -> int | None:
    """Return the number of days until a job expires."""
    if expires_at is None:
        return None
    return (expires_at.date() - _today_utc()).days


def _normalize_range_key(range_key: str) -> str:
    """Normalize analytics range keys to a supported value."""
    return range_key if range_key in ANALYTICS_RANGE_DAYS else "30d"


def _analytics_window(range_key: str) -> tuple[str, datetime, date, date]:
    """Return the normalized range key and its date window."""
    normalized = _normalize_range_key(range_key)
    end_date = _today_utc()
    start_date = end_date - timedelta(days=ANALYTICS_RANGE_DAYS[normalized] - 1)
    start_dt = datetime.combine(start_date, datetime.min.time(), tzinfo=UTC)
    return normalized, start_dt, start_date, end_date


def _date_sequence(start_date: date, end_date: date) -> list[date]:
    """Return all dates in an inclusive range."""
    days = (end_date - start_date).days
    return [start_date + timedelta(days=index) for index in range(days + 1)]


def _round_days(value: float | None) -> float | None:
    """Round a duration in days to one decimal place."""
    if value is None:
        return None
    return round(value, 1)


def _average_duration_days(rows: list[tuple[datetime, datetime]]) -> float | None:
    """Compute the average duration in days across datetime pairs."""
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
    """Return the active company ID and name for a recruiter user."""
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


async def _build_candidate_dashboard(
    db: AsyncSession, current_user: User
) -> CandidateDashboardResponse:
    """Run the queries that produce the candidate dashboard response."""
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
            Application.stage,
            Application.created_at,
            Application.updated_at,
        )
        .join(Job, Job.id == Application.job_id)
        .join(Company, Company.id == Job.company_id)
        .where(Application.user_id == current_user.id)
        .order_by(Application.updated_at.desc())
        .limit(8)
    )

    applications = []
    for row in application_rows.all():
        applications.append(
            ApplicationPipelineItem(
                id=row.id,
                job_id=row.job_id,
                job_title=row.job_title,
                company_name=row.company_name,
                company_logo_url=row.company_logo_url,
                location=row.location,
                location_type=row.location_type,
                status=row.stage,
                created_at=row.created_at,
                updated_at=row.updated_at,
                pipeline_step=_pipeline_step(row.stage),
            )
        )

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
            Application.stage.label("application_status"),
        )
        .join(Application, Application.id == Interview.application_id)
        .join(Job, Job.id == Application.job_id)
        .join(Company, Company.id == Job.company_id)
        .where(
            Application.user_id == current_user.id,
            Application.stage == ApplicationStage.interview,
            ~_INTERVIEW_DONE,
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

    return CandidateDashboardResponse(
        user_name=current_user.full_name,
        is_open_to_work=is_open_to_work,
        applications=applications,
        interviews=interviews,
    )


async def get_candidate_dashboard(
    db: AsyncSession, current_user: User
) -> CandidateDashboardResponse:
    """Build the candidate dashboard summary response (SWR-cached)."""
    cache_key = f"dashboard:candidate:{current_user.id}"

    async def _load() -> dict:
        response = await _build_candidate_dashboard(db, current_user)
        return response.model_dump(mode="json")

    payload = await swr_get(cache_key, _load, soft_ttl=60, hard_ttl=300)
    return CandidateDashboardResponse.model_validate(payload)


async def _build_candidate_dashboard_analytics(
    db: AsyncSession,
    current_user: User,
    normalized_range: str,
    start_dt: datetime,
    start_date: date,
    end_date: date,
) -> CandidateDashboardAnalyticsResponse:
    """Run the queries that produce the candidate dashboard analytics response."""
    stats_row = (
        await db.execute(
            select(
                func.count(Application.id).label("total_applications"),
                func.sum(
                    case(
                        (Application.stage == ApplicationStage.shortlisted, 1),
                        else_=0,
                    )
                ).label("shortlisted"),
                func.sum(
                    case((Application.stage == ApplicationStage.interview, 1), else_=0)
                ).label("interviews"),
                func.sum(
                    case((Application.stage == ApplicationStage.offer, 1), else_=0)
                ).label("offers"),
                func.sum(
                    case((Application.stage == ApplicationStage.rejected, 1), else_=0)
                ).label("rejected"),
            ).where(Application.user_id == current_user.id)
        )
    ).one()

    stats = CandidateAnalyticsStats(
        total_applications=stats_row.total_applications or 0,
        shortlisted=stats_row.shortlisted or 0,
        interviews=stats_row.interviews or 0,
        offers=stats_row.offers or 0,
        rejected=stats_row.rejected or 0,
    )

    activity_rows = (
        await db.execute(
            select(
                Application.created_at, Application.updated_at, Application.stage
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

        if row.stage == ApplicationStage.shortlisted:
            timeseries_by_date[updated_day]["shortlisted"] += 1
        elif row.stage == ApplicationStage.interview:
            timeseries_by_date[updated_day]["interviews"] += 1
        elif row.stage == ApplicationStage.offer:
            timeseries_by_date[updated_day]["offers"] += 1
        elif row.stage == ApplicationStage.rejected:
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
                Application.stage.in_(tuple(SHORTLIST_RELATED_STAGES)),
            )
        )
    ).all()
    interview_rows = (
        await db.execute(
            select(Application.created_at, Application.updated_at).where(
                Application.user_id == current_user.id,
                Application.stage.in_(tuple(INTERVIEW_RELATED_STAGES)),
            )
        )
    ).all()
    offer_rows = (
        await db.execute(
            select(Application.created_at, Application.updated_at).where(
                Application.user_id == current_user.id,
                Application.stage == ApplicationStage.offer,
            )
        )
    ).all()

    return CandidateDashboardAnalyticsResponse(
        range_key=normalized_range,
        stats=stats,
        funnel=[
            StageCountPoint(stage="applied", count=stats.total_applications),
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


async def get_candidate_dashboard_analytics(
    db: AsyncSession, current_user: User, range_key: str
) -> CandidateDashboardAnalyticsResponse:
    """Build analytics for the candidate dashboard (SWR-cached)."""
    normalized_range, start_dt, start_date, end_date = _analytics_window(range_key)
    cache_key = f"dashboard:candidate:{current_user.id}:analytics:{normalized_range}"

    async def _load() -> dict:
        response = await _build_candidate_dashboard_analytics(
            db, current_user, normalized_range, start_dt, start_date, end_date
        )
        return response.model_dump(mode="json")

    payload = await swr_get(cache_key, _load, soft_ttl=60, hard_ttl=300)
    return CandidateDashboardAnalyticsResponse.model_validate(payload)


async def _get_recruiter_stats(
    db: AsyncSession, company_id: uuid.UUID
) -> RecruiterStats:
    """Aggregate recruiter dashboard headline stats for a company."""
    today = _today_utc()
    stats_stmt = (
        select(
            func.count(func.distinct(Job.id))
            .filter(Job.status == JobStatus.open)
            .label("active_jobs"),
            func.count(func.distinct(Application.id)).label("total_applications"),
            func.count(func.distinct(Application.id))
            .filter(Application.stage == ApplicationStage.shortlisted)
            .label("shortlisted"),
            func.count(func.distinct(Interview.id))
            .filter(func.date(Interview.start_time) == today)
            .label("interviews_today"),
        )
        .select_from(Job)
        .outerjoin(Application, Application.job_id == Job.id)
        .outerjoin(Interview, Interview.application_id == Application.id)
        .where(Job.company_id == company_id)
    )
    stats_row = (await db.execute(stats_stmt)).one()
    return RecruiterStats(
        active_jobs=stats_row.active_jobs or 0,
        total_applications=stats_row.total_applications or 0,
        shortlisted=stats_row.shortlisted or 0,
        interviews_today=stats_row.interviews_today or 0,
    )


async def _get_active_jobs(
    db: AsyncSession, company_id: uuid.UUID
) -> list[JobPipelineItem]:
    """Return active job pipeline summaries for a company."""
    result = await db.execute(
        select(
            Job.id,
            Job.title,
            Job.status,
            Job.closes_at,
            func.count(Application.id).label("total_applications"),
            func.sum(
                case((Application.stage == ApplicationStage.new, 1), else_=0)
            ).label("applied_count"),
            func.sum(
                case((Application.stage == ApplicationStage.shortlisted, 1), else_=0)
            ).label("shortlisted_count"),
            func.sum(
                case((Application.stage == ApplicationStage.rejected, 1), else_=0)
            ).label("rejected_count"),
        )
        .select_from(Job)
        .outerjoin(Application, Application.job_id == Job.id)
        .where(Job.company_id == company_id, Job.status == JobStatus.open)
        .group_by(Job.id)
        .order_by(Job.closes_at.asc().nulls_last(), Job.created_at.asc())
        .limit(5)
    )

    return [
        JobPipelineItem(
            id=row.id,
            title=row.title,
            status=row.status,
            expires_at=row.closes_at,
            days_until_expiry=_job_days_until_expiry(row.closes_at),
            total_applications=row.total_applications or 0,
            applied_count=row.applied_count or 0,
            shortlisted_count=row.shortlisted_count or 0,
            rejected_count=row.rejected_count or 0,
        )
        for row in result.all()
    ]


async def _get_todays_interviews(
    db: AsyncSession, company_id: uuid.UUID
) -> list[TodayInterview]:
    """Return today's interviews for a company."""
    result = await db.execute(
        select(
            Interview.id.label("interview_id"),
            Interview.application_id,
            Interview.candidate_name,
            Interview.candidate_email,
            Interview.start_time,
            Job.title.label("job_title"),
            Application.stage.label("application_status"),
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


async def _build_recruiter_dashboard(
    db: AsyncSession, current_user: User
) -> RecruiterDashboardResponse:
    """Run the queries that produce the recruiter dashboard response."""
    company_id, company_name = await _get_company_context(db, current_user.id)
    if company_id is None:
        return RecruiterDashboardResponse(
            company_name="",
            recruiter_name=current_user.full_name,
            stats=RecruiterStats(
                active_jobs=0,
                total_applications=0,
                shortlisted=0,
                interviews_today=0,
            ),
            active_jobs=[],
            todays_interviews=[],
        )

    return RecruiterDashboardResponse(
        company_name=company_name,
        recruiter_name=current_user.full_name,
        stats=await _get_recruiter_stats(db, company_id),
        active_jobs=await _get_active_jobs(db, company_id),
        todays_interviews=await _get_todays_interviews(db, company_id),
    )


async def get_recruiter_dashboard(
    db: AsyncSession, current_user: User
) -> RecruiterDashboardResponse:
    """Build the recruiter dashboard summary response (SWR-cached)."""
    cache_key = f"dashboard:recruiter:{current_user.id}"

    async def _load() -> dict:
        response = await _build_recruiter_dashboard(db, current_user)
        return response.model_dump(mode="json")

    payload = await swr_get(cache_key, _load, soft_ttl=60, hard_ttl=300)
    return RecruiterDashboardResponse.model_validate(payload)


async def _get_recruiter_analytics_stats(
    db: AsyncSession, company_id: uuid.UUID
) -> RecruiterAnalyticsStats:
    """Aggregate recruiter analytics headline stats for a company."""
    stats_row = (
        await db.execute(
            select(
                func.count(func.distinct(Job.id))
                .filter(Job.status == JobStatus.open)
                .label("active_jobs"),
                func.count(func.distinct(Application.id)).label("applications"),
                func.count(func.distinct(Application.id))
                .filter(Application.stage == ApplicationStage.shortlisted)
                .label("shortlisted"),
                func.count(func.distinct(Application.id))
                .filter(
                    Application.stage == ApplicationStage.interview, ~_INTERVIEW_DONE
                )
                .label("interview_booked"),
                func.count(func.distinct(Application.id))
                .filter(
                    Application.stage == ApplicationStage.interview, _INTERVIEW_DONE
                )
                .label("interview_completed"),
                func.count(func.distinct(Application.id))
                .filter(Application.stage == ApplicationStage.offer)
                .label("offers"),
            )
            .select_from(Job)
            .outerjoin(Application, Application.job_id == Job.id)
            .where(Job.company_id == company_id)
        )
    ).one()

    return RecruiterAnalyticsStats(
        active_jobs=stats_row.active_jobs or 0,
        applications=stats_row.applications or 0,
        shortlisted=stats_row.shortlisted or 0,
        interview_booked=stats_row.interview_booked or 0,
        interview_completed=stats_row.interview_completed or 0,
        offers=stats_row.offers or 0,
    )


async def _get_recruiter_applications_timeseries(
    db: AsyncSession,
    company_id: uuid.UUID,
    start_dt: datetime,
    start_date: date,
    end_date: date,
) -> list[RecruiterAnalyticsTimeseriesPoint]:
    """Build recruiter application counts over time."""
    application_rows = (
        await db.execute(
            select(
                Application.created_at,
                Review.updated_at.label("reviewed_at"),
                Review.state.label("review_state"),
            )
            .join(Job, Job.id == Application.job_id)
            .outerjoin(Review, Review.application_id == Application.id)
            .where(
                Job.company_id == company_id,
                (Application.created_at >= start_dt) | (Review.updated_at >= start_dt),
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

        if row.review_state == ReviewState.done.value and row.reviewed_at:
            reviewed_day = row.reviewed_at.date()
            if reviewed_day in timeseries_by_date:
                timeseries_by_date[reviewed_day]["completed_reviews"] += 1

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
    """Return the current interview load grouped by day."""
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
                >= datetime.combine(load_start, datetime.min.time(), tzinfo=UTC),
                Interview.start_time
                < datetime.combine(
                    load_end + timedelta(days=1),
                    datetime.min.time(),
                    tzinfo=UTC,
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


async def _get_fit_distribution(
    db: AsyncSession, company_id: uuid.UUID
) -> FitDistribution:
    """Return how many reviewed applications landed in each fit bucket."""
    rows = (
        await db.execute(
            select(Review.fit, func.count(Review.id))
            .join(Application, Application.id == Review.application_id)
            .join(Job, Job.id == Application.job_id)
            .where(
                Job.company_id == company_id,
                Review.state == ReviewState.done.value,
                Review.fit.is_not(None),
            )
            .group_by(Review.fit)
        )
    ).all()
    counts = {fit: int(count) for fit, count in rows}
    return FitDistribution(
        buckets=[
            FitDistributionBucket(label=fit.value, count=counts.get(fit.value, 0))
            for fit in (Fit.strong, Fit.possible, Fit.weak)
        ]
    )


async def _get_recruiter_velocity(
    db: AsyncSession, company_id: uuid.UUID
) -> RecruiterAnalyticsVelocity:
    """Compute recruiter workflow velocity metrics for a company."""
    rows = (
        await db.execute(
            select(
                Application.created_at,
                Application.updated_at,
                Application.stage,
                Review.state.label("review_state"),
                Review.updated_at.label("reviewed_at"),
            )
            .join(Job, Job.id == Application.job_id)
            .outerjoin(Review, Review.application_id == Application.id)
            .where(Job.company_id == company_id)
        )
    ).all()

    review_rows: list[tuple[datetime, datetime]] = []
    shortlist_rows: list[tuple[datetime, datetime]] = []
    interview_rows: list[tuple[datetime, datetime]] = []

    for row in rows:
        if row.review_state == ReviewState.done.value and row.reviewed_at:
            review_rows.append((row.created_at, row.reviewed_at))
        if row.stage in SHORTLIST_RELATED_STAGES:
            shortlist_rows.append((row.created_at, row.updated_at))
        if row.stage in INTERVIEW_RELATED_STAGES:
            interview_rows.append((row.created_at, row.updated_at))

    return RecruiterAnalyticsVelocity(
        avg_days_to_review=_average_duration_days(review_rows),
        avg_days_to_shortlist=_average_duration_days(shortlist_rows),
        avg_days_to_interview=_average_duration_days(interview_rows),
    )


async def _build_recruiter_dashboard_analytics(
    db: AsyncSession,
    current_user: User,
    normalized_range: str,
    start_dt: datetime,
    start_date: date,
    end_date: date,
) -> RecruiterDashboardAnalyticsResponse:
    """Run the queries that produce the recruiter analytics response."""
    company_id, _company_name = await _get_company_context(db, current_user.id)
    if company_id is None:
        return RecruiterDashboardAnalyticsResponse(
            range_key=normalized_range,
            stats=RecruiterAnalyticsStats(
                active_jobs=0,
                applications=0,
                shortlisted=0,
                interview_booked=0,
                interview_completed=0,
                offers=0,
            ),
            funnel=[],
            applications_timeseries=[],
            interview_load=[],
            fit_distribution=FitDistribution(buckets=[]),
            velocity=RecruiterAnalyticsVelocity(),
        )

    stats = await _get_recruiter_analytics_stats(db, company_id)
    return RecruiterDashboardAnalyticsResponse(
        range_key=normalized_range,
        stats=stats,
        funnel=[
            StageCountPoint(stage="new", count=stats.applications),
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
        fit_distribution=await _get_fit_distribution(db, company_id),
        velocity=await _get_recruiter_velocity(db, company_id),
    )


async def get_recruiter_dashboard_analytics(
    db: AsyncSession, current_user: User, range_key: str
) -> RecruiterDashboardAnalyticsResponse:
    """Build analytics for the recruiter dashboard (SWR-cached)."""
    normalized_range, start_dt, start_date, end_date = _analytics_window(range_key)
    cache_key = f"dashboard:recruiter:{current_user.id}:analytics:{normalized_range}"

    async def _load() -> dict:
        response = await _build_recruiter_dashboard_analytics(
            db, current_user, normalized_range, start_dt, start_date, end_date
        )
        return response.model_dump(mode="json")

    payload = await swr_get(cache_key, _load, soft_ttl=60, hard_ttl=300)
    return RecruiterDashboardAnalyticsResponse.model_validate(payload)

from datetime import date, datetime
from uuid import UUID

from app.core.schemas import BaseSchema
from app.modules.auth.enums import MembershipStatus
from app.shared.enums import (
    ApplicationStage,
    JobClosedReason,
    JobStatus,
    LocationType,
)


class ApplicationPipelineItem(BaseSchema):
    id: UUID
    job_id: UUID
    job_title: str
    company_name: str
    company_logo_url: str | None = None
    location: str | None = None
    location_type: LocationType
    status: ApplicationStage
    created_at: datetime
    updated_at: datetime
    pipeline_step: int | None


class CandidateInterviewItem(BaseSchema):
    interview_id: UUID
    application_id: UUID
    job_id: UUID
    job_title: str
    company_name: str
    company_logo_url: str | None = None
    start_time: datetime
    end_time: datetime
    location: str | None = None
    title: str | None = None
    application_status: ApplicationStage


class CandidateDashboardResponse(BaseSchema):
    user_name: str
    is_open_to_work: bool = False
    applications: list[ApplicationPipelineItem]
    interviews: list[CandidateInterviewItem]


class StageCountPoint(BaseSchema):
    stage: str
    count: int


class CandidateAnalyticsStats(BaseSchema):
    total_applications: int
    shortlisted: int
    interviews: int
    offers: int
    rejected: int


class CandidateAnalyticsTimeseriesPoint(BaseSchema):
    date: date
    applications: int
    shortlisted: int
    interviews: int
    offers: int
    rejected: int


class CandidateAnalyticsVelocity(BaseSchema):
    avg_days_to_shortlist: float | None = None
    avg_days_to_interview: float | None = None
    avg_days_to_offer: float | None = None


class CandidateDashboardAnalyticsResponse(BaseSchema):
    range_key: str
    stats: CandidateAnalyticsStats
    funnel: list[StageCountPoint]
    timeseries: list[CandidateAnalyticsTimeseriesPoint]
    velocity: CandidateAnalyticsVelocity


class JobPipelineItem(BaseSchema):
    id: UUID
    title: str
    status: JobStatus
    closes_at: datetime | None
    days_until_close: int | None
    total_applications: int
    applied_count: int
    shortlisted_count: int
    rejected_count: int


class TodayInterview(BaseSchema):
    interview_id: UUID
    application_id: UUID
    candidate_name: str
    candidate_email: str | None = None
    job_title: str
    start_time: datetime
    application_status: ApplicationStage


class RecruiterStats(BaseSchema):
    active_jobs: int
    total_applications: int
    shortlisted: int
    interviews_today: int


class RecruiterDashboardResponse(BaseSchema):
    company_name: str
    recruiter_name: str
    stats: RecruiterStats
    active_jobs: list[JobPipelineItem]
    todays_interviews: list[TodayInterview]


class JoinRequestItem(BaseSchema):
    membership_id: UUID
    recruiter_name: str
    recruiter_email: str
    requested_at: datetime


class TeamMemberActivity(BaseSchema):
    membership_id: UUID
    recruiter_name: str
    membership_status: MembershipStatus
    active_jobs: int = 0
    shortlisted_this_month: int
    interviews_this_month: int


class RecruiterAdminStats(RecruiterStats):
    pending_join_requests: int


class RecruiterAdminDashboardResponse(BaseSchema):
    company_name: str
    recruiter_name: str
    stats: RecruiterAdminStats
    active_jobs: list[JobPipelineItem]
    todays_interviews: list[TodayInterview]
    join_requests: list[JoinRequestItem]
    team_activity: list[TeamMemberActivity]


class RecruiterAnalyticsStats(BaseSchema):
    active_jobs: int
    applications: int
    shortlisted: int
    interview_booked: int
    interview_completed: int
    offers: int


class RecruiterAnalyticsTimeseriesPoint(BaseSchema):
    date: date
    new_applicants: int
    completed_reviews: int
    interviews_scheduled: int


class InterviewLoadPoint(BaseSchema):
    date: date
    count: int


class FitDistributionBucket(BaseSchema):
    # strong | possible | weak
    label: str
    count: int


class FitDistribution(BaseSchema):
    buckets: list[FitDistributionBucket]


class RecruiterAnalyticsVelocity(BaseSchema):
    avg_days_to_review: float | None = None
    avg_days_to_shortlist: float | None = None
    avg_days_to_interview: float | None = None


class RecruiterDashboardAnalyticsResponse(BaseSchema):
    range_key: str
    stats: RecruiterAnalyticsStats
    funnel: list[StageCountPoint]
    applications_timeseries: list[RecruiterAnalyticsTimeseriesPoint]
    interview_load: list[InterviewLoadPoint]
    fit_distribution: FitDistribution
    velocity: RecruiterAnalyticsVelocity


class HomeInterview(BaseSchema):
    interview_id: UUID
    application_id: UUID
    job_id: UUID
    candidate_name: str
    job_title: str
    start_time: datetime
    end_time: datetime
    location: str | None = None


class RoleCard(BaseSchema):
    """One open (or recently closed) role with the work waiting on it."""

    job_id: UUID
    title: str
    status: JobStatus
    location: str | None = None
    location_type: LocationType
    created_at: datetime
    closes_at: datetime | None = None
    closed_at: datetime | None = None
    # hired | cancelled | expired when status is closed.
    closed_reason: JobClosedReason | None = None
    applicants: int
    # Applications nobody has decided on yet (stage new).
    to_review: int
    # Of those, how many the review rated a strong fit.
    strong: int
    # Shortlisted candidates with no decision email scheduled or sent.
    to_contact: int
    upcoming_interviews: int
    # Interviewed (completed, or booked with the time already past) and
    # still without an offer / rejection.
    to_decide: int
    # Public apply-link slug (/jobs/{slug}).
    share_slug: str


class DraftRole(BaseSchema):
    job_id: UUID
    title: str
    updated_at: datetime


class RecruiterHomeResponse(BaseSchema):
    first_name: str
    company_name: str
    is_admin: bool
    interviews_today: list[HomeInterview]
    next_interview: HomeInterview | None = None
    roles: list[RoleCard]
    drafts: list[DraftRole]

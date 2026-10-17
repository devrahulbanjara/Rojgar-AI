from datetime import date, datetime
from uuid import UUID

from app.core.schemas import BaseSchema
from app.shared.enums import ApplicationStatus, JobStatus, LocationType


class ApplicationPipelineItem(BaseSchema):
    id: UUID
    job_id: UUID
    job_title: str
    company_name: str
    company_logo_url: str | None = None
    location: str | None = None
    location_type: LocationType
    status: ApplicationStatus
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
    application_status: ApplicationStatus


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
    expires_at: datetime | None
    days_until_expiry: int | None
    total_applications: int
    applied_count: int
    shortlisted_count: int
    rejected_count: int


class TodayInterview(BaseSchema):
    interview_id: UUID
    application_id: UUID
    candidate_name: str
    candidate_email: str
    job_title: str
    start_time: datetime
    application_status: ApplicationStatus


class PendingDraftItem(BaseSchema):
    draft_id: UUID
    application_id: UUID
    candidate_name: str
    job_title: str
    email_type: str
    subject: str


class RecruiterStats(BaseSchema):
    active_jobs: int
    total_applications: int
    shortlisted: int
    interviews_today: int
    pending_drafts: int


class RecruiterDashboardResponse(BaseSchema):
    company_name: str
    recruiter_name: str
    stats: RecruiterStats
    active_jobs: list[JobPipelineItem]
    todays_interviews: list[TodayInterview]
    pending_drafts: list[PendingDraftItem]


class RecruiterAnalyticsStats(BaseSchema):
    active_jobs: int
    applications: int
    shortlisted: int
    interview_booked: int
    interview_completed: int
    offers: int
    pending_drafts: int


class RecruiterAnalyticsTimeseriesPoint(BaseSchema):
    date: date
    new_applicants: int
    completed_reviews: int
    interviews_scheduled: int


class InterviewLoadPoint(BaseSchema):
    date: date
    count: int


class ScoreDistributionBucket(BaseSchema):
    label: str
    count: int


class ScoreDistribution(BaseSchema):
    buckets: list[ScoreDistributionBucket]


class OutreachStateBreakdown(BaseSchema):
    drafted: int
    approved: int
    sent: int
    discarded: int


class RecruiterOutreachSummary(BaseSchema):
    shortlist: OutreachStateBreakdown
    rejection: OutreachStateBreakdown


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
    score_distribution: ScoreDistribution
    outreach: RecruiterOutreachSummary
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
    expires_at: datetime | None = None
    applicants: int
    # Applications nobody has decided on yet.
    to_review: int
    # Of those, how many scored at or above the job's shortlist threshold.
    strong: int
    # Shortlisted candidates who haven't been emailed yet.
    to_contact: int
    upcoming_interviews: int
    # Interviewed (completed, or booked with the time already past) and
    # still without an offer / rejection.
    to_decide: int
    hiring_completed: bool = False
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

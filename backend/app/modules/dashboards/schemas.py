from datetime import datetime
from uuid import UUID

from app.core.schemas import BaseSchema
from app.modules.auth.enums import MembershipStatus
from app.shared.enums import ApplicationStatus, JobStatus, LocationType


class CandidateStats(BaseSchema):
    total_applications: int
    shortlisted: int
    interviews_booked: int
    offers: int
    rejected: int


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


class CandidateDashboardResponse(BaseSchema):
    user_name: str
    is_open_to_work: bool = False
    stats: CandidateStats
    applications: list[ApplicationPipelineItem]


class JobPipelineItem(BaseSchema):
    id: UUID
    title: str
    status: JobStatus
    expires_at: datetime | None
    days_until_expiry: int | None
    total_applications: int
    applied_count: int
    screening_count: int
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


class JoinRequestItem(BaseSchema):
    membership_id: UUID
    recruiter_name: str
    recruiter_email: str
    requested_at: datetime


class TeamMemberActivity(BaseSchema):
    membership_id: UUID
    recruiter_name: str
    membership_status: MembershipStatus
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
    pending_drafts: list[PendingDraftItem]
    join_requests: list[JoinRequestItem]
    team_activity: list[TeamMemberActivity]

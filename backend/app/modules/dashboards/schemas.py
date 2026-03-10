from datetime import datetime
from uuid import UUID

from app.core.schemas import BaseSchema
from app.modules.applications.schemas import CandidateApplicationView
from app.modules.jobs.schemas import JobListItem
from app.shared.enums import ApplicationStatus, LocationType


class CandidateStats(BaseSchema):
    total_applications: int
    active_interviews: int
    offers_received: int
    total_resumes: int
    profile_completion: int


class CandidateDashboardRecentApplication(BaseSchema):
    id: UUID
    job_id: UUID
    status: ApplicationStatus
    created_at: datetime
    updated_at: datetime
    job_title: str
    company_name: str
    location: str | None = None
    location_type: LocationType


class CandidateDashboardActivityItem(BaseSchema):
    id: UUID
    application_id: UUID
    status: ApplicationStatus
    text: str
    time: datetime


class CandidateDashboardResponse(BaseSchema):
    user_name: str
    stats: CandidateStats
    recent_applications: list[CandidateApplicationView]
    recent_activity: list[CandidateDashboardActivityItem]
    recommended_jobs: list[JobListItem]


class RecruiterDashboardResponse(BaseSchema):
    company_name: str
    top_jobs: list[JobListItem]

from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.core.schemas import BaseSchema
from app.modules.activity.schemas import ActivityEventResponse
from app.modules.resumes.schemas import ResumeResponse
from app.shared.enums import ApplicationStatus, LocationType


class ApplyRequest(BaseSchema):
    """Candidate applies to a job. MUST attach an existing resume."""

    job_id: UUID
    resume_id: UUID
    share_profile_all: bool = True
    share_avatar: bool = True
    share_email: bool = True
    share_phone: bool = True
    share_location: bool = True
    share_links: bool = True
    share_headline_summary: bool = True


class CandidateShareSettings(BaseSchema):
    share_profile_all: bool
    share_avatar: bool
    share_email: bool
    share_phone: bool
    share_location: bool
    share_links: bool
    share_headline_summary: bool


class UpdateApplicationStatusRequest(BaseSchema):
    """Company/recruiter updates the application status.

    Only the following values are accepted:
    shortlisted, rejected, interview_completed, offer
    """

    status: ApplicationStatus = Field(
        ...,
        description=(
            "New status. Allowed values: shortlisted, rejected, "
            "interview_completed, offer."
        ),
    )


class UpdateApplicationReviewRequest(BaseSchema):
    """Company/recruiter updates manual score and/or feedback for an application."""

    score: int | None = Field(default=None, ge=0, le=100)
    feedback: str | None = None


class ApplicationResponse(BaseSchema):
    id: UUID
    job_id: UUID
    user_id: UUID
    resume_id: UUID
    status: ApplicationStatus
    created_at: datetime
    updated_at: datetime
    score: int | None = None
    feedback: str | None = None
    resume: ResumeResponse | None = None
    job_title: str | None = None
    company_name: str | None = None
    company_logo_url: str | None = None
    location: str | None = None
    location_type: LocationType | None = None
    interview: "RecruiterCandidateInterviewView | None" = None
    timeline: list[ActivityEventResponse] = Field(default_factory=list)
    next_step_hint: str | None = None


class ApplicantSummary(BaseSchema):
    """Lightweight user info embedded in ApplicationListItem."""

    id: UUID
    full_name: str
    email: str


class ApplicationListItem(BaseSchema):
    """Lightweight view for listing applications."""

    id: UUID
    job_id: UUID
    user_id: UUID
    status: ApplicationStatus
    created_at: datetime
    applicant: ApplicantSummary


class CandidateApplicationView(BaseSchema):
    """Candidate-facing application row used by dashboard and applications page."""

    id: UUID
    status: ApplicationStatus
    created_at: datetime
    updated_at: datetime
    job_id: UUID
    job_title: str
    company_name: str
    company_logo_url: str | None = None
    location: str | None = None
    location_type: LocationType
    score: int | None = None
    feedback: str | None = None


class RecruiterApplicationView(BaseSchema):
    """Recruiter-facing application row used for company inbox and job applicants."""

    id: UUID
    status: ApplicationStatus
    created_at: datetime
    updated_at: datetime
    applicant_name: str
    applicant_email: str
    applicant_avatar_url: str | None = None
    job_title: str
    job_id: UUID
    score: int | None = None
    feedback: str | None = None


class RecruiterCandidateApplicationSummary(BaseSchema):
    application_id: UUID
    job_id: UUID
    job_title: str
    status: ApplicationStatus
    created_at: datetime
    updated_at: datetime
    score: int | None = None
    feedback: str | None = None


class RecruiterCandidateInterviewView(BaseSchema):
    id: UUID
    cal_booking_uid: str
    start_time: datetime
    end_time: datetime
    timezone: str | None = None
    location: str | None = None
    title: str | None = None
    created_at: datetime


class RecruiterCandidateListItem(BaseSchema):
    candidate_id: UUID
    applicant_name: str
    applicant_email: str
    applicant_avatar_url: str | None = None
    latest_application_id: UUID
    latest_status: ApplicationStatus
    latest_applied_at: datetime
    latest_updated_at: datetime
    primary_job_title: str
    primary_job_id: UUID
    application_count: int
    applications: list[RecruiterCandidateApplicationSummary]


class RecruiterCandidateDetailView(BaseSchema):
    id: UUID
    candidate_id: UUID
    status: ApplicationStatus
    created_at: datetime
    updated_at: datetime
    applicant_name: str
    applicant_email: str | None = None
    applicant_avatar_url: str | None = None
    candidate_headline: str | None = None
    candidate_summary: str | None = None
    candidate_phone: str | None = None
    candidate_location: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None
    job_title: str
    job_id: UUID
    score: int | None = None
    feedback: str | None = None
    interview: RecruiterCandidateInterviewView | None = None
    resume: ResumeResponse | None = None
    share_settings: CandidateShareSettings
    timeline: list[ActivityEventResponse] = Field(default_factory=list)
    outreach_audit: list["ApplicationOutreachAuditItem"] = Field(default_factory=list)


class ApplicationOutreachAuditItem(BaseSchema):
    draft_id: UUID
    subject: str | None = None
    is_approved: bool
    is_sent: bool
    is_discarded: bool
    generated_by_user_id: UUID | None = None
    approved_by_user_id: UUID | None = None
    approved_at: datetime | None = None
    sent_by_user_id: UUID | None = None
    sent_at: datetime | None = None
    discarded_by_user_id: UUID | None = None
    discarded_at: datetime | None = None
    updated_at: datetime

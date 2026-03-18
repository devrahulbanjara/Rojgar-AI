from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.core.schemas import BaseSchema
from app.modules.resumes.schemas import ResumeResponse
from app.shared.enums import ApplicationStatus, LocationType


class ApplyRequest(BaseSchema):
    """Candidate applies to a job. MUST attach an existing resume."""

    job_id: UUID
    resume_id: UUID


class UpdateApplicationStatusRequest(BaseSchema):
    """Company/recruiter updates the application status."""

    status: ApplicationStatus = Field(
        ...,
        description="New status for the application",
    )


class ApplicationResponse(BaseSchema):
    id: UUID
    job_id: UUID
    user_id: UUID
    resume_id: UUID
    status: ApplicationStatus
    created_at: datetime
    updated_at: datetime
    resume: ResumeResponse | None = None


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

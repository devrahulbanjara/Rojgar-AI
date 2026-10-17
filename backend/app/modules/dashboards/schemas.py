from datetime import datetime
from uuid import UUID

from app.core.schemas import BaseSchema
from app.shared.enums import (
    JobClosedReason,
    JobStatus,
    LocationType,
)


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

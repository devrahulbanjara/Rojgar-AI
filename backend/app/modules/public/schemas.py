from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import EmailStr, Field

from app.core.schemas import BaseSchema
from app.shared.enums import LocationType

ApplySource = Literal[
    "linkedin", "facebook", "merojob", "viber", "qr", "referral", "direct", "other"
]
# What an applicant sees; the AI review is never shown.
Stage = Literal[
    "new", "shortlisted", "interview", "offer", "hired", "not_selected", "withdrawn"
]


class PublicCompany(BaseSchema):
    name: str
    slug: str
    logo_url: str | None = None
    website_url: str | None = None
    location: str | None = None
    industry: str | None = None
    description: str | None = None
    phone: str | None = None
    verified: bool = False


class PublicJobSummary(BaseSchema):
    slug: str
    title: str
    location: str | None = None
    location_type: LocationType
    salary_min: int | None = None
    salary_max: int | None = None
    currency: str
    posted_at: datetime
    expires_at: datetime | None = None


class PublicJob(PublicJobSummary):
    company: PublicCompany
    overview: str | None = None
    responsibilities: list[str] = Field(default_factory=list)
    requirements: list[str] = Field(default_factory=list)
    preferred_qualifications: list[str] = Field(default_factory=list)
    benefits: list[str] = Field(default_factory=list)
    screening_questions: list[str] = Field(default_factory=list)


class CareersPage(BaseSchema):
    company: PublicCompany
    jobs: list[PublicJobSummary]


class CvPrefill(BaseSchema):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None


class ScreeningAnswer(BaseSchema):
    question: str = Field(max_length=300)
    answer: str = Field(max_length=2000)


class GuestApplicationCreated(BaseSchema):
    application_id: UUID
    job_title: str
    company_name: str
    phone: str
    email: str | None = None
    # The status link goes by email (proves the address) and by SMS.
    status_link_sent: bool


class InterviewInfo(BaseSchema):
    starts_at: datetime
    ends_at: datetime
    location: str | None = None
    join_url: str | None = None


class ApplicationStatusView(BaseSchema):
    application_id: UUID
    job_title: str
    job_slug: str
    company_name: str
    company_slug: str
    stage: Stage
    interview: InterviewInfo | None = None
    applied_at: datetime
    updated_at: datetime
    can_withdraw: bool


class StatusTokenRequest(BaseSchema):
    token: str = Field(min_length=10, max_length=2000)


class WithdrawResult(BaseSchema):
    withdrawn: bool
    data_deleted: bool


class MagicLinkRequest(BaseSchema):
    email: EmailStr


class MagicLinkSent(BaseSchema):
    sent: bool = True


class MyApplication(BaseSchema):
    application_id: UUID
    job_title: str
    job_slug: str
    company_name: str
    company_slug: str
    company_logo_url: str | None = None
    stage: Stage
    interview: InterviewInfo | None = None
    applied_at: datetime
    updated_at: datetime
    # Opens the status page (details, add to calendar, withdraw).
    status_token: str


class RecommendRequest(BaseSchema):
    """Someone suggests a person they know for a job."""

    referrer_name: str = Field(min_length=1, max_length=255)
    referrer_phone: str | None = Field(default=None, max_length=30)
    name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=7, max_length=30)
    note: str | None = Field(default=None, max_length=500)
    # Share-link token from ?ref= on the job page, when there is one.
    ref: str | None = Field(default=None, max_length=64)


class RecommendSent(BaseSchema):
    sent: bool = True

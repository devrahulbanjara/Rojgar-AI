from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import EmailStr, Field

from app.core.schemas import BaseSchema
from app.shared.enums import ApplicationStatus, LocationType

ApplySource = Literal["linkedin", "facebook", "merojob", "direct", "other"]


class PublicCompany(BaseSchema):
    name: str
    slug: str
    logo_url: str | None = None
    website_url: str | None = None
    location: str | None = None
    industry: str | None = None
    description: str | None = None


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
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None


class ScreeningAnswer(BaseSchema):
    question: str = Field(max_length=300)
    answer: str = Field(max_length=2000)


class GuestApplicationCreated(BaseSchema):
    application_id: UUID
    job_title: str
    company_name: str
    email: str
    # The status link is only ever sent by email (proves the address is real).
    status_link_sent: bool


class ApplicationStatusView(BaseSchema):
    application_id: UUID
    job_title: str
    job_slug: str
    company_name: str
    company_slug: str
    status: ApplicationStatus
    status_label: str
    next_step: str | None = None
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
    status: ApplicationStatus
    status_label: str
    next_step: str | None = None
    applied_at: datetime
    updated_at: datetime

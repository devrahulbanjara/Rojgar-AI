from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import EmailStr, Field

from app.core.schemas import BaseSchema
from app.shared.enums import (
    ApplicationStage,
    EmploymentType,
    JobCategory,
    LocationType,
    QuestionType,
)

# Where a shared link was opened (UTM-like `src` on the apply link).
ApplySource = Literal[
    "linkedin", "facebook", "merojob", "viber", "qr", "direct", "other"
]


class PublicCompany(BaseSchema):
    name: str
    slug: str
    logo_url: str | None = None
    website_url: str | None = None
    location: str | None = None
    industry: str | None = None
    description: str | None = None
    # Approved by Rojgar AI staff ("Verified business" badge).
    verified: bool = False


class PublicCategory(BaseSchema):
    value: JobCategory
    label: str


class PublicJobSummary(BaseSchema):
    slug: str
    title: str
    location: str | None = None
    location_type: LocationType
    category: PublicCategory
    employment_type: EmploymentType
    salary_min: int | None = None
    salary_max: int | None = None
    currency: str
    posted_at: datetime
    closes_at: datetime | None = None


class PublicQuestion(BaseSchema):
    """Apply-form question. Which answer counts against someone is not shown."""

    label: str
    type: QuestionType
    required: bool


class PublicJob(PublicJobSummary):
    company: PublicCompany
    # Markdown.
    description: str = ""
    must_haves: list[str] = Field(default_factory=list)
    nice_to_haves: list[str] = Field(default_factory=list)
    questions: list[PublicQuestion] = Field(default_factory=list)
    # Name of the person whose share link was opened (?ref=), for "Shared by …".
    shared_by: str | None = None


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
    email: str | None = None
    # The status link is only ever sent by email (proves the address is real).
    status_link_sent: bool


class RecommendRequest(BaseSchema):
    """Someone recommends a person for the job (no account needed)."""

    ref_token: str | None = Field(default=None, max_length=32)
    referrer_name: str = Field(min_length=1, max_length=255)
    referrer_phone: str | None = Field(default=None, max_length=30)
    candidate_name: str = Field(min_length=1, max_length=255)
    candidate_phone: str = Field(min_length=6, max_length=30)
    note: str | None = Field(default=None, max_length=1000)


class RecommendCreated(BaseSchema):
    recommended: bool = True
    # True when the candidate got an SMS with a link to add their details.
    candidate_notified: bool = False


class ApplicationStatusView(BaseSchema):
    application_id: UUID
    job_title: str
    job_slug: str
    company_name: str
    company_slug: str
    stage: ApplicationStage
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
    stage: ApplicationStage
    status_label: str
    next_step: str | None = None
    applied_at: datetime
    updated_at: datetime

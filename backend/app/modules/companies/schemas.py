from datetime import datetime
from uuid import UUID
from pydantic import Field

from app.core.schemas import BaseSchema
from app.modules.auth.enums import MembershipStatus


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------


class RegisterCompanyRequest(BaseSchema):
    """Payload sent by the frontend after signing up with primary_role='recruiter_admin'."""

    setup_token: str
    company_name: str = Field(min_length=1, max_length=255)
    industry: str | None = Field(default=None, max_length=100)
    company_size: str | None = Field(default=None, max_length=50)
    website: str | None = Field(default=None, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    description: str | None = None


class JoinCompanyRequest(BaseSchema):
    """Payload sent by recruiters requesting to join an existing company."""

    setup_token: str
    company_name: str = Field(min_length=1, max_length=255)
    message: str | None = None


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------


class CompanyResponse(BaseSchema):
    id: UUID
    name: str
    logo_url: str | None = None
    industry: str | None = None
    company_size: str | None = None
    location: str | None = None
    website_url: str | None = None
    description: str | None = None
    created_at: datetime
    updated_at: datetime


class UpdateCompanyRequest(BaseSchema):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    industry: str | None = Field(default=None, max_length=100)
    company_size: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default=None, max_length=255)
    website_url: str | None = Field(default=None, max_length=255)
    description: str | None = None


# ---------------------------------------------------------------------------
# Recruiter management (company-admin only)
# ---------------------------------------------------------------------------


class RecruiterMemberResponse(BaseSchema):
    """A single recruiter member of the company, as seen by the company admin."""

    membership_id: UUID
    user_id: UUID
    full_name: str
    email: str
    avatar_url: str | None = None
    status: MembershipStatus
    joined_at: datetime


class UpdateRecruiterStatusRequest(BaseSchema):
    """Approve or reject a pending recruiter join request."""

    status: MembershipStatus = Field(
        ...,
        description="Must be 'active' (approve) or 'rejected' (reject)",
    )

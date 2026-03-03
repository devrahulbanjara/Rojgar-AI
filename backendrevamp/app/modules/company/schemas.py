from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.modules.auth.enums import MembershipStatus


class AppModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------


class RegisterCompanyRequest(AppModel):
    """Payload sent by the frontend after signing up with primary_role='company'."""

    setup_token: str
    company_name: str = Field(min_length=1, max_length=255)
    industry: str = Field(min_length=1, max_length=100)
    company_size: str = Field(min_length=1, max_length=50)
    website: str | None = Field(default=None, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    description: str | None = None


class JoinCompanyRequest(AppModel):
    """Payload sent by recruiters requesting to join an existing company."""

    setup_token: str
    company_name: str = Field(min_length=1, max_length=255)
    message: str | None = None


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------


class CompanyResponse(AppModel):
    id: UUID
    name: str
    industry: str | None = None
    company_size: str | None = None
    location: str | None = None
    website_url: str | None = None
    description: str | None = None


# ---------------------------------------------------------------------------
# Recruiter management (company-admin only)
# ---------------------------------------------------------------------------


class RecruiterMemberResponse(AppModel):
    """A single recruiter member of the company, as seen by the company admin."""
    membership_id: UUID
    user_id: UUID
    full_name: str
    email: str
    avatar_url: str | None = None
    status: MembershipStatus
    joined_at: datetime


class UpdateRecruiterStatusRequest(AppModel):
    """Approve or reject a pending recruiter join request."""
    status: MembershipStatus = Field(
        ...,
        description="Must be 'active' (approve) or 'rejected' (reject)",
    )

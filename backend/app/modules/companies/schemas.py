from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.core.schemas import BaseSchema
from app.modules.auth.enums import BusinessStatus, MembershipRole

# ---------------------------------------------------------------------------
# Business
# ---------------------------------------------------------------------------


class CompanyResponse(BaseSchema):
    id: UUID
    name: str
    slug: str
    logo_url: str | None = None
    industry: str | None = None
    company_size: str | None = None
    location: str | None = None
    district: str | None = None
    phone: str | None = None
    pan_number: str | None = None
    website_url: str | None = None
    description: str | None = None
    status: BusinessStatus
    status_reason: str | None = None
    verified: bool
    has_registration_doc: bool = False
    created_at: datetime
    updated_at: datetime


class UpdateCompanyRequest(BaseSchema):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    industry: str | None = Field(default=None, max_length=100)
    company_size: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default=None, max_length=255)
    website_url: str | None = Field(default=None, max_length=255)
    description: str | None = None


class BusinessOptions(BaseSchema):
    types: list[str]
    districts: list[str]


# ---------------------------------------------------------------------------
# Team
# ---------------------------------------------------------------------------


class MemberResponse(BaseSchema):
    membership_id: UUID
    user_id: UUID
    full_name: str
    email: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    role: MembershipRole
    joined_at: datetime


class RoleUpdate(BaseSchema):
    role: MembershipRole


class InviteCreate(BaseSchema):
    role: MembershipRole = MembershipRole.manager


class InviteResponse(BaseSchema):
    id: UUID
    role: MembershipRole
    expires_at: datetime
    created_at: datetime
    created_by_name: str | None = None


class InviteCreated(InviteResponse):
    # Shown once; only a hash of the token is stored.
    url: str


class InvitePreview(BaseSchema):
    business_name: str
    role: MembershipRole
    invited_by: str | None = None
    # Set when the link can't be used (expired, used or cancelled).
    problem: str | None = None


class InviteAccepted(BaseSchema):
    business_id: UUID

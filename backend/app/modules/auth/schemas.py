from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import AfterValidator, EmailStr, Field

from app.core.schemas import BaseSchema
from app.modules.auth.enums import BusinessStatus, MembershipRole
from app.shared.normalize import normalize_email, normalize_phone

# Emails are compared and stored lowercase (see ix_users_email_lower).
NormalizedEmail = Annotated[EmailStr, AfterValidator(normalize_email)]


def _mobile(value: str) -> str:
    """Nepali mobile number in E.164 (+9779XXXXXXXXX), the only kind we can SMS."""
    phone = normalize_phone(value)
    if not phone or not (len(phone) == 14 and phone[:6] in _MOBILE_PREFIXES):
        raise ValueError("Enter a 10-digit mobile number, like 98XXXXXXXX.")
    return phone


_MOBILE_PREFIXES = {"+97796", "+97797", "+97798"}
MobilePhone = Annotated[str, Field(max_length=20), AfterValidator(_mobile)]


class SignupRequest(BaseSchema):
    full_name: str = Field(min_length=2, max_length=255)
    email: NormalizedEmail
    password: str = Field(min_length=8, max_length=128)


class OtpRequest(BaseSchema):
    phone: MobilePhone


class OtpVerifyRequest(BaseSchema):
    phone: MobilePhone
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class ActiveBusinessRequest(BaseSchema):
    business_id: UUID


class LoginRequest(BaseSchema):
    email: NormalizedEmail
    password: str
    remember_me: bool = False


class ForgotPasswordRequest(BaseSchema):
    email: NormalizedEmail


class UpdateMeRequest(BaseSchema):
    full_name: str = Field(min_length=2, max_length=255)


class ChangePasswordRequest(BaseSchema):
    current_password: str | None = None
    new_password: str = Field(min_length=8, max_length=128)


class ResetPasswordRequest(BaseSchema):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class VerifyEmailRequest(BaseSchema):
    token: str


class TokenResponse(BaseSchema):
    access_token: str
    token_type: str = "bearer"


class MembershipSummary(BaseSchema):
    membership_id: UUID
    business_id: UUID
    business_name: str
    business_status: BusinessStatus
    # Staff message: what to add, or why it was rejected or suspended.
    status_reason: str | None = None
    role: MembershipRole
    active: bool


class UserResponse(BaseSchema):
    id: UUID
    full_name: str
    email: EmailStr | None = None
    phone: str | None = None
    is_email_verified: bool
    is_onboarded: bool
    avatar_url: str | None = None
    created_at: datetime
    is_platform_admin: bool = False
    memberships: list[MembershipSummary] = Field(default_factory=list)
    # The business the person is working in now (members land on /recruiter).
    active_business: MembershipSummary | None = None
    has_applications: bool = False


class LoginResponse(BaseSchema):
    tokens: TokenResponse
    user: UserResponse
    # True when this sign-in created the account (phone sign-up).
    is_new: bool = False

from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import AfterValidator, EmailStr, Field

from app.core.schemas import BaseSchema
from app.modules.auth.enums import MembershipStatus, UserRole
from app.shared.normalize import normalize_email

# Emails are compared and stored lowercase (see ix_users_email_lower).
NormalizedEmail = Annotated[EmailStr, AfterValidator(normalize_email)]


class SignupRequest(BaseSchema):
    full_name: str = Field(min_length=2, max_length=255)
    email: NormalizedEmail
    password: str = Field(min_length=8, max_length=128)
    primary_role: UserRole


class SignupData(BaseSchema):
    setup_token: str | None = None


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


class GoogleRegisterRequest(BaseSchema):
    signup_token: str
    primary_role: UserRole


class AuthUserResponse(BaseSchema):
    id: UUID
    full_name: str
    email: EmailStr
    primary_role: UserRole
    is_email_verified: bool
    is_onboarded: bool
    avatar_url: str | None = None
    membership_status: MembershipStatus | None = None


class LoginResponse(BaseSchema):
    tokens: TokenResponse
    user: AuthUserResponse


class UserResponse(BaseSchema):
    id: UUID
    full_name: str
    email: EmailStr
    primary_role: UserRole
    is_email_verified: bool
    is_onboarded: bool
    avatar_url: str | None = None
    created_at: datetime
    membership_status: MembershipStatus | None = None

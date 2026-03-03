from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.modules.auth.enums import MembershipStatus, UserRole


class AppModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Requests ---


class SignupRequest(AppModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    primary_role: UserRole


# --- Signup response data (only present for company/recruiter flows) ---


class SignupData(AppModel):
    setup_token: str | None = None


class LoginRequest(AppModel):
    email: EmailStr
    password: str
    remember_me: bool = False


class ForgotPasswordRequest(AppModel):
    email: EmailStr


class ResetPasswordRequest(AppModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class VerifyEmailRequest(AppModel):
    token: str


# --- Responses ---


class TokenResponse(AppModel):
    access_token: str
    token_type: str = "bearer"


class GoogleRegisterRequest(AppModel):
    signup_token: str
    primary_role: UserRole


class AuthUserResponse(AppModel):
    id: UUID
    full_name: str
    email: EmailStr
    primary_role: UserRole
    is_email_verified: bool
    avatar_url: str | None = None
    membership_status: MembershipStatus | None = None


class LoginResponse(AppModel):
    tokens: TokenResponse
    user: AuthUserResponse


class UserResponse(AppModel):
    id: UUID
    full_name: str
    email: EmailStr
    primary_role: UserRole
    is_email_verified: bool
    avatar_url: str | None = None
    created_at: datetime
    membership_status: MembershipStatus | None = None

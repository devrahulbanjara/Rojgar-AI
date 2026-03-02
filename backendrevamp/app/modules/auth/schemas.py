from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.modules.auth.enums import UserRole


class AppModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Requests ---


class SignupRequest(AppModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    primary_role: UserRole


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


class AuthUserResponse(AppModel):
    id: UUID
    full_name: str
    email: EmailStr
    primary_role: UserRole
    is_email_verified: bool
    avatar_url: str | None = None


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

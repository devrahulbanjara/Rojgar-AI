from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, field_validator


class UserRole(str, Enum):
    CANDIDATE = "candidate"
    RECRUITER = "recruiter"


class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    role: UserRole
    picture: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class CreateUserRequest(BaseModel):
    email: str
    name: str
    password: str | None = None
    google_id: str | None = None
    picture: str | None = None
    role: UserRole | None = None


class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False


class GoogleUserInfo(BaseModel):
    id: str
    email: str
    name: str
    picture: str | None = None
    verified_email: bool


class RoleSelectionRequest(BaseModel):
    role: UserRole


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str
    picture: str | None = None
    google_id: str | None = None
    role: UserRole | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

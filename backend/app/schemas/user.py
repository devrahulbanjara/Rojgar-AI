from typing import Optional
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict


class UserRole(str, Enum):
    CANDIDATE = "candidate"
    RECRUITER = "recruiter"


class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    role: UserRole
    picture: Optional[str] = None


class CreateUserRequest(BaseModel):
    email: str
    name: str
    password: Optional[str] = None
    google_id: Optional[str] = None
    picture: Optional[str] = None
    role: Optional[UserRole] = None


class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False


class GoogleUserInfo(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    verified_email: bool


class RoleSelectionRequest(BaseModel):
    role: UserRole


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    google_id: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

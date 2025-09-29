"""
User Pydantic schemas for request/response validation
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User role enumeration"""

    CANDIDATE = "candidate"
    RECRUITER = "recruiter"


class UserBase(BaseModel):
    """Base user schema"""

    email: str
    name: str
    picture: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a user"""

    google_id: str
    password: Optional[str] = None  # For email/password signup


class UserUpdate(BaseModel):
    """Schema for updating a user"""

    role: UserRole


class UserResponse(UserBase):
    """Schema for user response"""

    id: str
    google_id: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class TokenResponse(BaseModel):
    """Schema for token response"""

    access_token: str
    token_type: str
    user: UserResponse


class GoogleUserInfo(BaseModel):
    """Schema for Google user information"""

    id: str
    email: str
    name: str
    picture: Optional[str] = None
    verified_email: bool


class RoleSelectionRequest(BaseModel):
    """Schema for role selection request"""

    role: UserRole


class LoginRequest(BaseModel):
    """Schema for email/password login"""

    email: str
    password: str
    remember_me: bool = False


class SignupRequest(UserBase):
    """Schema for email/password signup"""

    password: str
    role: UserRole

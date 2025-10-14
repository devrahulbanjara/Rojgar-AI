"""
User models - unified SQLModel approach (single source of truth)
"""

from typing import Optional
from datetime import datetime
from enum import Enum
from sqlmodel import Field, SQLModel


class UserRole(str, Enum):
    """User role enumeration"""
    CANDIDATE = "candidate"
    RECRUITER = "recruiter"


# Base model with common fields
class UserBase(SQLModel):
    """Base user model with common fields"""
    email: str = Field(unique=True, index=True)
    name: str
    picture: Optional[str] = None


# Table model for database
class User(UserBase, table=True):
    """User table model"""
    id: str = Field(primary_key=True)
    google_id: Optional[str] = Field(default=None, unique=True, index=True)
    password_hash: Optional[str] = Field(default=None, exclude=True)
    role: Optional[UserRole] = Field(default=None)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# API schemas
class UserCreate(UserBase):
    """Schema for creating a user"""
    password: str
    role: UserRole


class UserRead(UserBase):
    """Schema for reading user data (API responses)"""
    id: str
    google_id: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class UserUpdate(SQLModel):
    """Schema for updating user data"""
    name: Optional[str] = None
    picture: Optional[str] = None
    role: Optional[UserRole] = None


# OAuth specific schemas
class GoogleUserInfo(SQLModel):
    """Schema for Google user information"""
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    verified_email: bool


class TokenResponse(SQLModel):
    """Schema for token response"""
    access_token: str
    token_type: str
    user: UserRead


class LoginRequest(SQLModel):
    """Schema for email/password login"""
    email: str
    password: str
    remember_me: bool = False


class SignupRequest(UserBase):
    """Schema for email/password signup"""
    password: str
    role: UserRole


class RoleSelectionRequest(SQLModel):
    """Schema for role selection request"""
    role: UserRole

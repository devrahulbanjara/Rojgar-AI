"""
User model - Simple, easy to understand
Everything related to users in one place
"""

from typing import Optional
from datetime import datetime
from enum import Enum
from sqlmodel import Field, SQLModel


class UserRole(str, Enum):
    """What type of user: candidate or recruiter"""
    CANDIDATE = "candidate"
    RECRUITER = "recruiter"


class User(SQLModel, table=True):
    """
    User table in database
    Stores all user information
    """
    # Basic info
    id: str = Field(primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    picture: Optional[str] = None
    
    # Auth info
    google_id: Optional[str] = Field(default=None, unique=True, index=True)
    password_hash: Optional[str] = Field(default=None)
    role: Optional[UserRole] = Field(default=None)
    
    # Status
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ============= Request/Response Schemas =============
# These are used for API input/output only

class SignupRequest(SQLModel):
    """What we need to create a new user account"""
    email: str
    password: str
    name: str
    role: UserRole
    picture: Optional[str] = None


class LoginRequest(SQLModel):
    """What we need to login"""
    email: str
    password: str
    remember_me: bool = False


class GoogleUserInfo(SQLModel):
    """Info we get back from Google OAuth"""
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    verified_email: bool


class RoleSelectionRequest(SQLModel):
    """To select role after Google login"""
    role: UserRole


class UserResponse(SQLModel):
    """What we send back about a user"""
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    google_id: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TokenResponse(SQLModel):
    """Response after successful login/signup"""
    access_token: str
    token_type: str
    user: UserResponse

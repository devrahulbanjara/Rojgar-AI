"""
User schemas - Pydantic models for user API data contracts
"""

from typing import Optional
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict, field_validator


class UserRole(str, Enum):
    """What type of user: candidate or recruiter"""
    CANDIDATE = "candidate"
    RECRUITER = "recruiter"


# ============= Request Schemas =============

class SignupRequest(BaseModel):
    """What we need to create a new user account"""
    email: str
    password: str
    name: str
    role: UserRole
    picture: Optional[str] = None


class LoginRequest(BaseModel):
    """What we need to login"""
    email: str
    password: str
    remember_me: bool = False


class GoogleUserInfo(BaseModel):
    """Info we get back from Google OAuth"""
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    verified_email: bool


class RoleSelectionRequest(BaseModel):
    """To select role after Google login"""
    role: UserRole


# ============= Response Schemas =============

class UserResponse(BaseModel):
    """What we send back about a user"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    google_id: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    @field_validator('role', mode='before')
    @classmethod
    def normalize_role(cls, v):
        """Convert role string to lowercase enum value"""
        if v is None:
            return v
        if isinstance(v, str):
            # Convert to lowercase to handle legacy uppercase values
            return v.lower()
        return v


class TokenResponse(BaseModel):
    """Response after successful login/signup"""
    access_token: str
    token_type: str
    user: UserResponse

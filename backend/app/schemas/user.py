from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel

# Import base model and enums from models layer
from app.models.user import UserBase, UserRole


class UserRead(UserBase):
    """Schema for reading user data in API responses"""

    id: str
    google_id: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class UserCreate(UserBase):
    """Schema for creating a user via API"""

    password: str
    role: UserRole


class UserUpdate(SQLModel):
    """Schema for updating user data via API"""

    name: Optional[str] = None
    picture: Optional[str] = None
    role: Optional[UserRole] = None


# OAuth and Auth specific schemas
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

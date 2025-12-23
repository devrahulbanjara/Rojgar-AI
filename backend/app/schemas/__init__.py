"""
Schemas package - Pydantic models for API data contracts.

This module provides request/response schemas for the API.
Import from here instead of individual submodules for a cleaner API.

Example:
    from app.schemas import UserResponse, JobResponse, ApplicationCreate
"""

# User schemas
from .user import (
    UserResponse,
    GoogleUserInfo,
    CreateUserRequest,
    SignupRequest,
    LoginRequest,
    RoleSelectionRequest,
    TokenResponse,
)

__all__ = [
    # User
    "UserResponse",
    "GoogleUserInfo",
    "CreateUserRequest",
    "SignupRequest",
    "LoginRequest",
    "RoleSelectionRequest",
    "TokenResponse",
]

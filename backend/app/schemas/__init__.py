"""
Schemas package - API-specific models for request/response handling

This layer provides clean separation between:
- Database models (app/models) - table definitions and base models
- API schemas (app/schemas) - request/response models that inherit from base models

This pattern:
1. Maintains single source of truth for field definitions (Base models)
2. Prevents circular import issues as the codebase grows
3. Allows API models to have different structure than database models
4. Keeps database layer concerns separate from API layer concerns
"""

from app.schemas.job import (
    JobRead,
    JobCreate,
    JobUpdate,
    JobSearchParams,
    CompanyRead,
    CompanyCreate,
)
from app.schemas.user import (
    UserRead,
    UserCreate,
    UserUpdate,
    TokenResponse,
    LoginRequest,
    SignupRequest,
    RoleSelectionRequest,
)
from app.schemas.application import (
    ApplicationRead,
    ApplicationCreate,
    ApplicationUpdate,
)

__all__ = [
    # Job schemas
    "JobRead",
    "JobCreate",
    "JobUpdate",
    "JobSearchParams",
    "CompanyRead",
    "CompanyCreate",
    # User schemas
    "UserRead",
    "UserCreate",
    "UserUpdate",
    "TokenResponse",
    "LoginRequest",
    "SignupRequest",
    "RoleSelectionRequest",
    # Application schemas
    "ApplicationRead",
    "ApplicationCreate",
    "ApplicationUpdate",
]


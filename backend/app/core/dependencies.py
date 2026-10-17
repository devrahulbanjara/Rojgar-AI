"""FastAPI dependency type aliases using Annotated for better type safety and reusability."""

from typing import Annotated

from fastapi import Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import (
    get_current_user,
    get_optional_user,
    get_verified_user,
    require_active_membership,
    require_admin,
    require_candidate,
    require_recruiter,
    require_recruiter_admin,
    require_recruiter_privileges,
)
from app.modules.auth.models import User

# Database session
DbSession = Annotated[AsyncSession, Depends(get_db)]

# User dependencies
CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]
VerifiedUser = Annotated[User, Depends(get_verified_user)]
ActiveMember = Annotated[User, Depends(require_active_membership)]
CandidateUser = Annotated[User, Depends(require_candidate)]
RecruiterUser = Annotated[User, Depends(require_recruiter)]
RecruiterAdmin = Annotated[User, Depends(require_recruiter_admin)]
RecruiterPrivileges = Annotated[User, Depends(require_recruiter_privileges)]
AdminUser = Annotated[User, Depends(require_admin)]

# Path IDs: validated as UUIDs (malformed values -> 400 instead of a 500 from
# the database), passed to services as canonical strings.
UUIDPath = Annotated[
    str,
    Path(
        pattern=r"^[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?"
        r"[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}$"
    ),
]

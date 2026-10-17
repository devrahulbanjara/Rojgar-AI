"""FastAPI dependency type aliases using Annotated for better type safety and reusability."""

from typing import Annotated

from fastapi import Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import (
    BusinessContext,
    get_current_user,
    get_optional_user,
    require_business_member,
    require_member_user,
    require_platform_admin,
)
from app.modules.auth.enums import MembershipRole
from app.modules.auth.models import User

_OWNER = MembershipRole.owner
_MANAGER = MembershipRole.manager

# Database session
DbSession = Annotated[AsyncSession, Depends(get_db)]

# People. Anyone signed in can apply and see their own applications.
CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]

# Business members (active business, or {business_id} from the path).
ActiveMember = Annotated[User, Depends(require_member_user())]
OwnerUser = Annotated[User, Depends(require_member_user(_OWNER))]
# Owners and managers: decisions, jobs, invites to interview. Not interviewers.
ManagerUser = Annotated[User, Depends(require_member_user(_OWNER, _MANAGER))]
MemberContext = Annotated[BusinessContext, Depends(require_business_member())]
ManagerContext = Annotated[
    BusinessContext, Depends(require_business_member(_OWNER, _MANAGER))
]
OwnerContext = Annotated[BusinessContext, Depends(require_business_member(_OWNER))]

# Rojgar AI staff.
PlatformAdmin = Annotated[User, Depends(require_platform_admin)]

# Path IDs: validated as UUIDs (malformed values -> 400 instead of a 500 from
# the database), passed to services as canonical strings.
UUIDPath = Annotated[
    str,
    Path(
        pattern=r"^[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?"
        r"[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}$"
    ),
]

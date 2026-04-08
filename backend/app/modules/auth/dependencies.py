# app/modules/auth/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.request_context import bind_actor
from app.core.security import decode_access_token
from app.modules.auth.enums import UserRole
from app.modules.auth.models import User

# tokenUrl must match the path of the swagger login route we will create
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login-swagger")
_optional_oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login-swagger", auto_error=False
)


async def get_optional_user(
    token: str | None = Depends(_optional_oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Returns the authenticated user if a valid token is supplied, otherwise None."""
    if not token:
        return None
    user_id = decode_access_token(token)
    if not user_id:
        return None
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is not None:
        bind_actor(actor_user_id=user.id, actor_role=user.primary_role.value)
    return user


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    bind_actor(actor_user_id=user.id, actor_role=user.primary_role.value)
    return user


async def get_verified_user(user: User = Depends(get_current_user)) -> User:
    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified"
        )
    return user


async def require_candidate(user: User = Depends(get_current_user)) -> User:
    if user.primary_role != UserRole.candidate:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Candidate role required",
        )
    return user


async def require_recruiter(user: User = Depends(get_current_user)) -> User:
    if user.primary_role != UserRole.recruiter:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Recruiter role required",
        )
    return user


async def require_recruiter_admin(user: User = Depends(get_current_user)) -> User:
    if user.primary_role != UserRole.recruiter_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Recruiter-admin role required",
        )
    return user


async def require_recruiter_privileges(user: User = Depends(get_current_user)) -> User:
    """The standard dependency for Job management and Dashboards.

    Allows both staff recruiters and company admins.
    """
    if user.primary_role not in (UserRole.recruiter, UserRole.recruiter_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Recruiter or Company Admin role required",
        )
    return user


async def require_active_membership(
    user: User = Depends(require_recruiter_privileges),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Higher-security gate: ensures the recruiter holds an *active* company membership.

    Use this on endpoints where a pending or rejected recruiter must be blocked
    (e.g. posting jobs, viewing applications).
    """
    from app.modules.auth.utils import get_membership_status
    from app.modules.auth.enums import MembershipStatus as MS

    ms = await get_membership_status(db, user)
    if ms != MS.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your company membership is not active.",
        )
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.primary_role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Admin role required",
        )
    return user

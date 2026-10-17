# app/modules/auth/dependencies.py
"""Who is calling: a person, a business member with a role, or platform staff.

There are no global roles. Business access comes from the person's active
membership (role owner | manager | interviewer); platform staff carry
``users.is_platform_admin``.
"""

import uuid
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.request_context import bind_actor
from app.core.security import decode_access_token
from app.modules.auth.enums import MembershipRole, MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership

# tokenUrl must match the path of the swagger login route we will create
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login-swagger")
_optional_oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login-swagger", auto_error=False
)


def actor_role(user: User, membership: CompanyMembership | None = None) -> str:
    """Role recorded on audit rows for this request."""
    if user.is_platform_admin:
        return "platform_admin"
    return membership.role.value if membership else "person"


async def _load_user(db: AsyncSession, token: str | None) -> User | None:
    user_id = decode_access_token(token) if token else None
    if not user_id:
        return None
    user = await db.scalar(
        select(User).where(User.id == user_id, User.is_deleted.is_(False))
    )
    if user is not None:
        bind_actor(actor_user_id=user.id, actor_role=actor_role(user))
    return user


async def get_optional_user(
    token: Annotated[str | None, Depends(_optional_oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User | None:
    """Returns the authenticated user if a valid token is supplied, otherwise None."""
    return await _load_user(db, token)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Validate the Bearer token and return the authenticated user."""
    if not decode_access_token(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = await _load_user(db, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    return user


@dataclass(frozen=True)
class BusinessContext:
    """The caller, their membership and the business it belongs to."""

    user: User
    membership: CompanyMembership
    business: Company

    @property
    def role(self) -> MembershipRole:
        return self.membership.role


_ROLE_DENIED = {
    frozenset({MembershipRole.owner}): "Only the business owner can do this.",
    frozenset(
        {MembershipRole.owner, MembershipRole.manager}
    ): "Only owners and managers can do this.",
}


def require_business_member(*roles: MembershipRole):
    """Dependency factory: the caller must belong to a business with one of ``roles``.

    The business is ``{business_id}`` from the path when the route has one,
    otherwise the person's active business. No roles means any member.
    """
    allowed = frozenset(roles)

    async def dependency(
        request: Request,
        user: Annotated[User, Depends(get_current_user)],
        db: Annotated[AsyncSession, Depends(get_db)],
    ) -> BusinessContext:
        stmt = (
            select(CompanyMembership, Company)
            .join(Company, Company.id == CompanyMembership.company_id)
            .where(CompanyMembership.user_id == user.id)
        )
        business_id = request.path_params.get("business_id")
        if business_id:
            try:
                business_id = uuid.UUID(business_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Not found."
                ) from None
            stmt = stmt.where(CompanyMembership.company_id == business_id)
        else:
            stmt = stmt.where(CompanyMembership.status == MembershipStatus.active)
        row = (await db.execute(stmt)).first()
        if row is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You're not part of this business."
                if business_id
                else "You're not part of a business yet.",
            )
        membership, business = row
        if allowed and membership.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=_ROLE_DENIED.get(allowed, "Your role can't do this."),
            )
        bind_actor(actor_user_id=user.id, actor_role=actor_role(user, membership))
        return BusinessContext(user=user, membership=membership, business=business)

    return dependency


def require_member_user(*roles: MembershipRole):
    """Same check as ``require_business_member`` for routes that only need the User."""
    check = require_business_member(*roles)

    async def dependency(
        context: Annotated[BusinessContext, Depends(check)],
    ) -> User:
        return context.user

    return dependency


async def require_platform_admin(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Rojgar AI staff only."""
    if not user.is_platform_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Rojgar AI staff can open this.",
        )
    return user

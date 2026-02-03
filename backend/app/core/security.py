import hashlib
import uuid
from datetime import timedelta
from typing import TYPE_CHECKING

from fastapi import Depends, Request
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import settings
from .current_datetime import get_datetime
from .database import get_db
from .exceptions import ForbiddenError, NotFoundError, UnauthorizedError

if TYPE_CHECKING:
    from app.models.user import User


def hash_password(password: str) -> str:
    return hashlib.sha256(f"{password}{settings.SECRET_KEY}".encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password


def create_token(
    entity_id: str, entity_type: str = "user", expires_minutes: int | None = None
) -> str:
    now = get_datetime()
    if expires_minutes:
        expire = now + timedelta(minutes=expires_minutes)
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {"sub": entity_id, "entity_type": entity_type, "exp": expire}
    token = jwt.encode(token_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token


def verify_token(token: str) -> tuple[uuid.UUID, str]:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        entity_id = payload.get("sub")
        entity_type = payload.get("entity_type", "user")
        if entity_id is None:
            raise UnauthorizedError(
                message="Invalid token",
                details={
                    "reason": "missing_entity_id",
                    "entity_type": entity_type,
                },
            )
        return (uuid.UUID(entity_id), entity_type)
    except JWTError as e:
        raise UnauthorizedError(
            message="Invalid or expired token",
            details={
                "reason": "jwt_decode_error",
                "error_type": type(e).__name__,
            },
        )


def get_current_user_id(request: Request) -> uuid.UUID:
    token = request.cookies.get("auth_token")
    if not token:
        raise UnauthorizedError(
            message="Not logged in",
            details={
                "reason": "no_auth_token",
            },
            request_id=getattr(request.state, "request_id", None),
        )
    entity_id, entity_type = verify_token(token)
    if entity_type != "user":
        raise ForbiddenError(
            message="User authentication required",
            details={
                "entity_type": entity_type,
                "entity_id": str(entity_id),
            },
            request_id=getattr(request.state, "request_id", None),
        )
    return entity_id


def get_current_organization_id(request: Request) -> uuid.UUID:
    token = request.cookies.get("auth_token")
    if not token:
        raise UnauthorizedError(
            message="Not logged in",
            details={
                "reason": "no_auth_token",
            },
            request_id=getattr(request.state, "request_id", None),
        )
    entity_id, entity_type = verify_token(token)
    if entity_type != "organization":
        raise ForbiddenError(
            message="Organization authentication required",
            details={
                "entity_type": entity_type,
                "entity_id": str(entity_id),
            },
            request_id=getattr(request.state, "request_id", None),
        )
    return entity_id


async def get_current_active_user(
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> "User":
    from app.models.user import User

    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError(
            message="User not found",
            details={
                "user_id": str(user_id),
            },
        )
    return user


def get_current_user_id_optional(request: Request) -> uuid.UUID | None:
    token = request.cookies.get("auth_token")
    if not token:
        return None
    try:
        entity_id, entity_type = verify_token(token)
        if entity_type != "user":
            return None
        return entity_id
    except (UnauthorizedError, ForbiddenError):
        return None


async def get_current_active_user_optional(
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID | None = Depends(get_current_user_id_optional),
) -> "User | None":
    if not user_id:
        return None
    from app.models.user import User

    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    return user

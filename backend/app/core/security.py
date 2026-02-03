import hashlib
import uuid
from datetime import timedelta
from typing import TYPE_CHECKING

from fastapi import Depends, HTTPException, Request, status
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db

from .config import settings
from .current_datetime import get_datetime

if TYPE_CHECKING:
    from app.db.models.user import User


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
            raise ValueError("Invalid token")
        return (uuid.UUID(entity_id), entity_type)
    except JWTError:
        raise ValueError("Invalid or expired token")


def get_current_user_id(request: Request) -> uuid.UUID:
    token = request.cookies.get("auth_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in to access this resource.",
        )
    try:
        entity_id, entity_type = verify_token(token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication token. Please log in again. ({str(e)})",
        )
    if entity_type != "user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. User authentication required for this endpoint.",
        )
    return entity_id


def get_current_organization_id(request: Request) -> uuid.UUID:
    token = request.cookies.get("auth_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in to access this resource.",
        )
    try:
        entity_id, entity_type = verify_token(token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication token. Please log in again. ({str(e)})",
        )
    if entity_type != "organization":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Organization-level authentication required for this endpoint.",
        )
    return entity_id


async def get_current_active_user(
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
) -> "User":
    from app.db.models.user import User

    result = await db.execute(
        select(User)
        .where(User.user_id == user_id)
        .options(selectinload(User.google_account), selectinload(User.organization))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
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
    except (HTTPException, ValueError):
        return None


async def get_current_active_user_optional(
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID | None = Depends(get_current_user_id_optional),
) -> "User | None":
    if not user_id:
        return None
    from app.db.models.user import User

    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    return user


async def get_current_recruiter_organization_id(
    request: Request,
) -> uuid.UUID:
    token = request.cookies.get("auth_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in to access this resource.",
        )

    try:
        entity_id, entity_type = verify_token(token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication token. Please log in again. ({str(e)})",
        )

    # Only accept organization tokens
    if entity_type != "organization":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. This endpoint requires organization-level authentication. Please log in with an organization account to manage recruiters.",
        )

    return entity_id

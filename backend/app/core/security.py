import hashlib
import uuid
from datetime import timedelta
from typing import TYPE_CHECKING

from fastapi import Depends, Request
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

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
            raise UnauthorizedError("Invalid token")
        return (uuid.UUID(entity_id), entity_type)
    except JWTError:
        raise UnauthorizedError("Invalid or expired token")


def get_current_user_id(request: Request) -> uuid.UUID:
    token = request.cookies.get("auth_token")
    if not token:
        raise UnauthorizedError("Not logged in")
    entity_id, entity_type = verify_token(token)
    if entity_type != "user":
        raise ForbiddenError("User authentication required")
    return entity_id


def get_current_organization_id(request: Request) -> uuid.UUID:
    token = request.cookies.get("auth_token")
    if not token:
        raise UnauthorizedError("Not logged in")
    entity_id, entity_type = verify_token(token)
    if entity_type != "organization":
        raise ForbiddenError("Organization authentication required")
    return entity_id


def get_current_active_user(
    db: Session = Depends(get_db), user_id: uuid.UUID = Depends(get_current_user_id)
) -> "User":
    from app.models.user import User

    user = db.scalar(select(User).where(User.user_id == user_id))
    if not user:
        raise NotFoundError("User not found")
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


def get_current_active_user_optional(
    db: Session = Depends(get_db),
    user_id: uuid.UUID | None = Depends(get_current_user_id_optional),
) -> "User | None":
    if not user_id:
        return None
    from app.models.user import User

    user = db.scalar(select(User).where(User.user_id == user_id))
    return user

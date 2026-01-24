import hashlib
from datetime import timedelta

from fastapi import HTTPException, Request, status
from jose import JWTError, jwt

from .config import settings
from .current_datetime import get_datetime


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


def verify_token(token: str) -> tuple[str, str]:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        entity_id = payload.get("sub")
        entity_type = payload.get("entity_type", "user")

        if entity_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        return entity_id, entity_type

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def get_current_user_id(request: Request) -> str:
    token = request.cookies.get("auth_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not logged in",
        )

    entity_id, entity_type = verify_token(token)

    if entity_type != "user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User authentication required",
        )

    return entity_id


def get_current_organization_id(request: Request) -> str:
    token = request.cookies.get("auth_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not logged in",
        )

    entity_id, entity_type = verify_token(token)

    if entity_type != "organization":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization authentication required",
        )

    return entity_id

import uuid
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.core.config import settings

ph = PasswordHasher()


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(hashed: str | None, plain: str) -> bool:
    if not hashed:
        return False
    try:
        return ph.verify(hashed, plain)
    except VerifyMismatchError:
        return False


def create_tokens(user_id: str) -> tuple[dict, str, datetime]:
    """
    Returns (token_dict, jti, refresh_expires_at)
    Caller is responsible for persisting jti to refresh_tokens table.
    """
    now = datetime.now(timezone.utc)
    jti = str(uuid.uuid4())
    refresh_expires_at = now + timedelta(days=settings.refresh_token_expire_days)

    access = jwt.encode(
        {
            "sub": user_id,
            "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
            "type": "access",
        },
        settings.secret_key,
        algorithm=settings.algorithm,
    )
    refresh = jwt.encode(
        {
            "sub": user_id,
            "jti": jti,
            "exp": refresh_expires_at,
            "type": "refresh",
        },
        settings.secret_key,
        algorithm=settings.algorithm,
    )
    tokens = {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}
    return tokens, jti, refresh_expires_at


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        if payload.get("type") != "access":
            return None
        return payload["sub"]
    except (jwt.PyJWTError, KeyError):
        return None


def decode_refresh_token(token: str) -> tuple[str, str] | None:
    """Returns (user_id, jti) or None if invalid."""
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        if payload.get("type") != "refresh":
            return None
        return payload["sub"], payload["jti"]
    except (jwt.PyJWTError, KeyError):
        return None


def create_signup_token(data: dict) -> str:
    """Creates a 15-minute token containing Google profile info for Two-Phase Social Signup."""
    payload = data.copy()
    payload.update(
        {
            "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
            "type": "signup",
        }
    )
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_signup_token(token: str) -> dict | None:
    """Validates a signup token; returns the payload dict or None if invalid/expired."""
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        if payload.get("type") != "signup":
            return None
        return payload
    except jwt.PyJWTError:
        return None

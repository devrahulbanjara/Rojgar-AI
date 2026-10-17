"""Signed links sent to candidates by email."""

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import settings

_STATUS_TYPE = "application_status"


def create_status_token(application_id: uuid.UUID) -> str:
    """Long-lived link that shows one application's status (and lets the candidate withdraw)."""
    payload = {
        "sub": str(application_id),
        "type": _STATUS_TYPE,
        "exp": datetime.now(timezone.utc)
        + timedelta(days=settings.public_status_token_days),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_status_token(token: str) -> uuid.UUID | None:
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        if payload.get("type") != _STATUS_TYPE:
            return None
        return uuid.UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None


def new_magic_token() -> tuple[str, str]:
    """Return (token for the email link, sha256 hex stored in the database)."""
    token = secrets.token_urlsafe(32)
    return token, hash_magic_token(token)


def hash_magic_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def status_url(token: str) -> str:
    return f"{settings.frontend_url}/applications/status?token={token}"

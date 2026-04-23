import uuid
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.core.config import settings

ph = PasswordHasher()


def hash_password(password: str) -> str:
    """Hash a plain-text password with Argon2."""
    return ph.hash(password)


def verify_password(hashed: str | None, plain: str) -> bool:
    """Verify a plain password against an Argon2 hash."""
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
    """Decode an access JWT and return the user ID if valid."""
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


def create_setup_token(user_id: str) -> str:
    """Creates a 15-minute token used to authenticate company registration after signup."""
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "type": "setup",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_setup_token(token: str) -> str | None:
    """Validates a setup token; returns user_id or None if invalid/expired."""
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        if payload.get("type") != "setup":
            return None
        return payload["sub"]
    except (jwt.PyJWTError, KeyError):
        return None


def create_pending_signup_token(data: dict) -> str:
    """
    24-hour JWT holding everything needed to create a user (and optionally a
    company or join-request) when the email-verification link is clicked.
    The token IS the verification link — no extra DB row is written at signup time.

    Recognised ``type`` values:
      • ``"pending_candidate"`` – plain candidate signup
      • ``"pending_company"``   – company-role signup; extra fields company_name, industry, etc.
      • ``"pending_recruiter"`` – recruiter-role signup; extra field join_company_name
    """
    payload = {
        **data,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_pending_signup_token(token: str) -> dict | None:
    """
    Validates a pending-signup JWT.
    Returns the full payload dict if the ``type`` is one of the recognised
    signup-flow values, else None.

    Recognised types:
      • ``"setup"``             – recruiter/admin after initial signup, before company step
      • ``"pending_candidate"`` – candidate awaiting email verification
      • ``"pending_company"``   – recruiter_admin; carries company details
      • ``"pending_recruiter"`` – recruiter; carries join-company details
    """
    _VALID_TYPES = {
        "setup",
        "pending_candidate",
        "pending_company",
        "pending_recruiter",
    }
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        if payload.get("type") not in _VALID_TYPES:
            return None
        return payload
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

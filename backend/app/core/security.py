import asyncio
import base64
import hashlib
import uuid
from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings
from app.core.constants import JWT_ALGORITHM

ph = PasswordHasher()

ACCESS_TOKEN_MINUTES = 15
REFRESH_TOKEN_DAYS = 7


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


async def hash_password_async(password: str) -> str:
    """Argon2 is deliberately slow (~50-100 ms of CPU): hash off the event loop."""
    return await asyncio.to_thread(hash_password, password)


async def verify_password_async(hashed: str | None, plain: str) -> bool:
    """Verify off the event loop so one login does not stall every request."""
    return await asyncio.to_thread(verify_password, hashed, plain)


def create_tokens(user_id: str) -> tuple[dict, str, datetime]:
    """
    Returns (token_dict, jti, refresh_expires_at)
    Caller is responsible for persisting jti to refresh_tokens table.
    """
    now = datetime.now(UTC)
    jti = str(uuid.uuid4())
    refresh_expires_at = now + timedelta(days=REFRESH_TOKEN_DAYS)

    access = jwt.encode(
        {
            "sub": user_id,
            "exp": now + timedelta(minutes=ACCESS_TOKEN_MINUTES),
            "type": "access",
        },
        settings.secret_key,
        algorithm=JWT_ALGORITHM,
    )
    refresh = jwt.encode(
        {
            "sub": user_id,
            "jti": jti,
            "exp": refresh_expires_at,
            "type": "refresh",
        },
        settings.secret_key,
        algorithm=JWT_ALGORITHM,
    )
    tokens = {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}
    return tokens, jti, refresh_expires_at


def decode_access_token(token: str) -> str | None:
    """Decode an access JWT and return the user ID if valid."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload["sub"]
    except (jwt.PyJWTError, KeyError):
        return None


def decode_refresh_token(token: str) -> tuple[str, str] | None:
    """Returns (user_id, jti) or None if invalid."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload["sub"], payload["jti"]
    except (jwt.PyJWTError, KeyError):
        return None


def _pending_token_cipher() -> Fernet:
    """Symmetric cipher for secrets carried inside pending-signup JWTs."""
    digest = hashlib.sha256(f"pending-signup:{settings.secret_key}".encode()).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def create_pending_signup_token(data: dict) -> str:
    """
    24-hour JWT holding everything needed to create a person when the
    email-verification link is clicked (``type="pending_person"``).
    The token IS the verification link — no extra DB row is written at signup time.
    """
    payload = {
        **data,
        "exp": datetime.now(UTC) + timedelta(hours=24),
    }
    # JWTs are signed, not encrypted, and these tokens travel in API responses
    # and email links; never expose the Argon2 hash in readable form.
    password_hash = payload.pop("password_hash", None)
    if password_hash:
        payload["password_hash_enc"] = (
            _pending_token_cipher().encrypt(password_hash.encode()).decode()
        )
    else:
        payload["password_hash"] = None
    return jwt.encode(payload, settings.secret_key, algorithm=JWT_ALGORITHM)


def decode_pending_signup_token(token: str) -> dict | None:
    """Validates a pending-signup JWT; returns its payload or None."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "pending_person":
            return None
        encrypted = payload.pop("password_hash_enc", None)
        if encrypted:
            payload["password_hash"] = (
                _pending_token_cipher().decrypt(encrypted.encode()).decode()
            )
        return payload
    except (jwt.PyJWTError, KeyError, InvalidToken):
        return None

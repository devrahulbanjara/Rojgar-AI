"""Sign in or sign up with a phone number and a 6-digit SMS code.

Codes are stored hashed, expire after 5 minutes and allow 5 wrong tries.
Sending is limited per phone (and per IP by the route's RateLimit).
"""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.rate_limit import TOO_MANY_MESSAGE, hit
from app.modules.auth.models import PhoneOtp, User
from app.shared.sms import send_sms

CODE_TTL = timedelta(minutes=5)
MAX_ATTEMPTS = 5
SENDS_PER_PHONE = 3
SEND_WINDOW_SECONDS = 600


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _hash(phone: str, code: str) -> str:
    return hmac.new(
        settings.secret_key.encode(), f"{phone}:{code}".encode(), hashlib.sha256
    ).hexdigest()


async def request_code(db: AsyncSession, phone: str) -> None:
    """Text a fresh code to ``phone``; earlier unused codes stop working."""
    if settings.rate_limit_enabled and not await hit(
        f"otp.send:phone:{phone}", SENDS_PER_PHONE, SEND_WINDOW_SECONDS
    ):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=TOO_MANY_MESSAGE,
            headers={"Retry-After": str(SEND_WINDOW_SECONDS)},
        )
    code = f"{secrets.randbelow(1_000_000):06d}"
    await db.execute(
        update(PhoneOtp)
        .where(PhoneOtp.phone == phone, PhoneOtp.consumed_at.is_(None))
        .values(consumed_at=_now())
    )
    db.add(
        PhoneOtp(
            phone=phone, code_hash=_hash(phone, code), expires_at=_now() + CODE_TTL
        )
    )
    await db.commit()
    await send_sms(
        phone,
        f"{code} is your {settings.product_name} code. "
        "It expires in 5 minutes. Never share it.",
    )


def _bad_code(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


async def verify_code(db: AsyncSession, phone: str, code: str) -> tuple[User, bool]:
    """Check the code; return the person for this phone (created if new)."""
    otp = await db.scalar(
        select(PhoneOtp)
        .where(PhoneOtp.phone == phone, PhoneOtp.consumed_at.is_(None))
        .order_by(PhoneOtp.created_at.desc())
        .limit(1)
        .with_for_update()
    )
    if otp is None or otp.expires_at <= _now():
        raise _bad_code("That code has expired. Ask for a new one.")
    if otp.attempts >= MAX_ATTEMPTS:
        raise _bad_code("Too many wrong tries. Ask for a new code.")
    if not hmac.compare_digest(otp.code_hash, _hash(phone, code)):
        otp.attempts += 1
        await db.commit()
        left = MAX_ATTEMPTS - otp.attempts
        raise _bad_code(
            f"That code is not right. {left} {'try' if left == 1 else 'tries'} left."
            if left
            else "Too many wrong tries. Ask for a new code."
        )
    otp.consumed_at = _now()

    user = await db.scalar(select(User).where(User.phone == phone))
    if user is not None and user.is_deleted:
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "account_deleted",
                "message": "This account has been deleted",
            },
        )
    is_new = user is None
    if is_new:
        # The name is asked right after, on the first screen.
        user = User(full_name="", phone=phone, is_onboarded=True)
        db.add(user)
        await db.flush()
    return user, is_new

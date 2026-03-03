import secrets
from datetime import datetime, timedelta, timezone

from fastapi import BackgroundTasks, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from loguru import logger
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.integrations.email.service import EmailService
from app.core.security import (
    create_tokens,
    decode_refresh_token,
    decode_signup_token,
    hash_password,
    verify_password,
)
from app.modules.auth.models import OAuthAccount, RefreshToken, User
from app.modules.auth.schemas import (
    ForgotPasswordRequest,
    GoogleRegisterRequest,
    LoginRequest,
    ResetPasswordRequest,
    SignupRequest,
    VerifyEmailRequest,
)


async def signup(
    db: AsyncSession, payload: SignupRequest, bg_tasks: BackgroundTasks
) -> dict:
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    verify_token = secrets.token_urlsafe(32)

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        primary_role=payload.primary_role,
        email_verify_token=verify_token,
    )
    db.add(user)
    await db.commit()

    logger.info(f"User signed up: {user.email}")

    bg_tasks.add_task(EmailService.send_verification, user.email, verify_token)

    return {"message": "Account created. Please verify your email."}


async def verify_email(db: AsyncSession, payload: VerifyEmailRequest) -> dict:
    result = await db.execute(
        select(User).where(User.email_verify_token == payload.token)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    user.is_email_verified = True
    user.email_verify_token = None
    await db.commit()
    logger.info(f"Email verified: {user.email}")

    return {"message": "Email verified successfully"}


async def login(db: AsyncSession, payload: LoginRequest, response: Response) -> dict:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(user.password_hash, payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in",
        )

    tokens, jti, refresh_expires_at = create_tokens(str(user.id))

    # 1. Set the httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=settings.environment.lower() == "prod",
        samesite="lax",
        expires=refresh_expires_at,
    )

    # 2. Persist JTI
    db.add(RefreshToken(user_id=user.id, jti=jti, expires_at=refresh_expires_at))
    await db.commit()

    # 3. REMOVE refresh_token from the JSON response
    # This ensures the frontend only sees the access_token
    tokens.pop("refresh_token")

    return {"tokens": tokens, "user": user}


async def google_register(
    db: AsyncSession, payload: GoogleRegisterRequest, response: Response
) -> dict:
    """Complete Two-Phase Social Signup: validate the signup token, create the user, and log them in."""
    data = decode_signup_token(payload.signup_token)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signup session expired. Please start over.",
        )

    # Guard against token replay after another browser tab already registered
    existing = await db.execute(select(User).where(User.email == data["email"]))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists. Please log in.",
        )

    # Create the User and OAuthAccount atomically
    user = User(
        full_name=data["full_name"],
        email=data["email"],
        avatar_url=data.get("avatar_url"),
        is_email_verified=True,
        primary_role=payload.primary_role,
    )
    db.add(user)
    await db.flush()  # generates user.id

    db.add(
        OAuthAccount(
            user_id=user.id,
            provider="google",
            provider_account_id=data["google_id"],
        )
    )

    tokens, jti, refresh_expires_at = create_tokens(str(user.id))
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=settings.environment == "prod",
        samesite="lax",
        expires=refresh_expires_at,
    )
    db.add(RefreshToken(user_id=user.id, jti=jti, expires_at=refresh_expires_at))
    await db.commit()

    logger.info(f"New user registered via Google: {user.email} as {user.primary_role}")
    tokens.pop("refresh_token")
    return {"tokens": tokens, "user": user}


async def login_swagger(db: AsyncSession, payload: OAuth2PasswordRequestForm) -> dict:
    result = await db.execute(select(User).where(User.email == payload.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(user.password_hash, payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    # Strict check: ensure email is verified
    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in",
        )

    tokens, jti, refresh_expires_at = create_tokens(str(user.id))

    db.add(
        RefreshToken(
            user_id=user.id,
            jti=jti,
            expires_at=refresh_expires_at,
        )
    )
    await db.commit()

    # Swagger REQUIREMENT: Must return access_token and token_type keys
    return {"access_token": tokens["access_token"], "token_type": "bearer"}


async def refresh_tokens(
    db: AsyncSession, refresh_token: str | None, response: Response
) -> dict:
    # 1. Check if token exists
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing"
        )

    # 2. Decode the token to get user_id and jti
    decoded = decode_refresh_token(refresh_token)
    if not decoded:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id, jti = decoded

    # 3. Verify JTI exists in the database (Revocation Check)
    result = await db.execute(select(RefreshToken).where(RefreshToken.jti == jti))
    token_row = result.scalar_one_or_none()

    if not token_row:
        # If the JTI isn't in the DB, it was either logged out or already used.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revoked"
        )

    # 4. Token Rotation: Delete the old token row
    await db.delete(token_row)

    # 5. Generate NEW tokens
    new_tokens, new_jti, new_expires_at = create_tokens(user_id)

    # 6. Persist the NEW JTI to the database
    db.add(
        RefreshToken(
            user_id=token_row.user_id,
            jti=new_jti,
            expires_at=new_expires_at,
        )
    )
    await db.commit()

    # 7. Update the httpOnly cookie with the NEW refresh token
    response.set_cookie(
        key="refresh_token",
        value=new_tokens["refresh_token"],
        httponly=True,
        # Set secure=True only in production (requires HTTPS)
        secure=settings.environment == "prod",
        samesite="lax",
        expires=new_expires_at,
    )

    # 8. Remove refresh_token from the JSON body
    # The frontend only receives the access_token in the response body
    new_tokens.pop("refresh_token")

    return new_tokens


async def logout(
    db: AsyncSession, refresh_token: str | None, response: Response
) -> dict:
    # 1. Delete from DB (only if a token was provided — handles already-logged-out users)
    if refresh_token:
        decoded = decode_refresh_token(refresh_token)
        if decoded:
            _, jti = decoded
            await db.execute(delete(RefreshToken).where(RefreshToken.jti == jti))
            await db.commit()

    # 2. Clear the cookie from the browser
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}


async def forgot_password(
    db: AsyncSession, payload: ForgotPasswordRequest, bg_tasks: BackgroundTasks
) -> dict:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    # always return same message — don't reveal if email exists
    if user and user.is_email_verified:
        reset_token = secrets.token_urlsafe(32)
        user.password_reset_token = reset_token
        user.password_reset_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.commit()
        logger.info(f"Password reset requested: {user.email}")

        # Queue the reset email AFTER the commit succeeds.
        # If the commit failed, this never runs — no email for a token that doesn't exist.
        bg_tasks.add_task(
            EmailService.send_password_reset, user.email, reset_token
        )

    return {"message": "If that email exists, a reset link has been sent"}


async def reset_password(db: AsyncSession, payload: ResetPasswordRequest) -> dict:
    result = await db.execute(
        select(User).where(User.password_reset_token == payload.token)
    )
    user = result.scalar_one_or_none()

    if not user or not user.password_reset_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    if user.password_reset_expires_at.replace(tzinfo=timezone.utc) < datetime.now(
        timezone.utc
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token has expired"
        )

    user.password_hash = hash_password(payload.new_password)
    user.password_reset_token = None
    user.password_reset_expires_at = None

    # revoke all refresh tokens on password reset — force re-login everywhere
    await db.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id))
    await db.commit()

    logger.info(f"Password reset successful: {user.email}")
    return {"message": "Password reset successfully. Please log in again."}

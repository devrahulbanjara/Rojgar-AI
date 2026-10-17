import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import BackgroundTasks, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from loguru import logger
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.normalize import normalize_email
from app.core.cache import (
    invalidate_company_dashboard_caches,
    invalidate_profile_read_caches,
)
from app.core.config import settings
from app.core.request_context import bind_actor
from app.core.security import (
    create_pending_signup_token,
    create_tokens,
    decode_pending_signup_token,
    decode_refresh_token,
    hash_password_async,
    verify_password_async,
)
from app.infrastructures.email.service import EmailService
from app.infrastructures.redis.service import redis_service
from app.modules.audit.service import create_custom_audit_log
from app.modules.auth import otp
from app.modules.auth.dependencies import actor_role
from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import RefreshToken, User
from app.modules.auth.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    OtpVerifyRequest,
    ResetPasswordRequest,
    SignupRequest,
    UpdateMeRequest,
    UserResponse,
    VerifyEmailRequest,
)
from app.modules.auth.utils import build_user_payload
from app.modules.companies.models import CompanyMembership
from app.modules.companies.team import activate_membership


async def invalidate_user_read_caches(db: AsyncSession, user: User) -> None:
    """Clear profile and company dashboard caches affected by user changes."""
    await invalidate_profile_read_caches(str(user.id))

    company_id = await db.scalar(
        select(CompanyMembership.company_id).where(
            CompanyMembership.user_id == user.id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    if company_id is None:
        return

    await invalidate_company_dashboard_caches(db, str(company_id))
    await redis_service.delete(f"company:recruiters:{company_id}")


async def _get_active_company_id_for_user(db: AsyncSession, user_id) -> UUID | None:
    """Return the active company ID for a user when one exists."""
    return await db.scalar(
        select(CompanyMembership.company_id).where(
            CompanyMembership.user_id == user_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )


async def get_me_data(db: AsyncSession, user: User) -> UserResponse:
    """Return the signed-in person with their businesses."""
    return await build_user_payload(db, user)


async def update_me_data(
    db: AsyncSession, user: User, payload: UpdateMeRequest
) -> UserResponse:
    """Update the user's full name."""
    user.full_name = payload.full_name.strip()
    await db.commit()
    await db.refresh(user)
    return await get_me_data(db, user)


async def change_password(
    db: AsyncSession, user: User, payload: ChangePasswordRequest
) -> None:
    """Change the user's password and revoke all refresh tokens."""
    if user.password_hash:
        if not payload.current_password or not await verify_password_async(
            user.password_hash, payload.current_password
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect.",
            )

    user.password_hash = await hash_password_async(payload.new_password)
    await db.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id))
    await db.commit()


async def signup(
    db: AsyncSession, payload: SignupRequest, bg_tasks: BackgroundTasks
) -> None:
    """Email sign-up: nothing is stored until the emailed link is opened."""
    result = await db.execute(
        select(User).where(func.lower(User.email) == normalize_email(payload.email))
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )
    token = create_pending_signup_token(
        {
            "type": "pending_person",
            "full_name": payload.full_name,
            "email": payload.email,
            "password_hash": await hash_password_async(payload.password),
        }
    )
    bg_tasks.add_task(EmailService.send_verification, payload.email, token)
    logger.info(f"Signup initiated for {payload.email}")


async def verify_email(db: AsyncSession, payload: VerifyEmailRequest) -> None:
    """Create the verified person from the emailed sign-up link."""
    data = decode_pending_signup_token(payload.token)
    # Only tokens delivered by email prove inbox ownership.
    if not data or not str(data.get("type", "")).startswith("pending_"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification link. Please sign up again.",
        )

    email: str = data["email"]
    existing = await db.execute(
        select(User).where(func.lower(User.email) == normalize_email(email))
    )
    if existing.scalar_one_or_none():
        logger.info(f"Duplicate verify-email click ignored for {email}")
        return

    user = User(
        full_name=data["full_name"],
        email=email,
        password_hash=data.get("password_hash"),
        is_email_verified=True,
        is_onboarded=True,
    )
    db.add(user)
    await db.commit()
    logger.info(f"User created via email verification: {email}")


async def start_session(db: AsyncSession, user: User, response: Response) -> dict:
    """Set the refresh cookie, record the sign-in and return the access token."""
    bind_actor(actor_user_id=user.id, actor_role=actor_role(user))
    await db.execute(
        delete(RefreshToken).where(
            RefreshToken.user_id == user.id,
            RefreshToken.expires_at < datetime.now(timezone.utc),
        )
    )
    tokens, jti, refresh_expires_at = create_tokens(str(user.id))
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=settings.environment.lower() == "prod",
        samesite="lax",
        path="/",
        expires=refresh_expires_at,
    )
    db.add(RefreshToken(user_id=user.id, jti=jti, expires_at=refresh_expires_at))
    await create_custom_audit_log(
        db,
        entity_type="session",
        action_type="recruiter_login",
        category="auth",
        message=f"{user.full_name or user.phone} logged in",
        entity_id=jti,
        target_user_id=user.id,
        company_id=await _get_active_company_id_for_user(db, user.id),
        metadata={"email": user.email, "phone": user.phone},
    )
    await db.commit()
    # The refresh token only travels in the HttpOnly cookie.
    tokens.pop("refresh_token")
    return tokens


async def verify_phone_code(
    db: AsyncSession, payload: OtpVerifyRequest, response: Response
) -> LoginResponse:
    """Sign in (or sign up) with the SMS code."""
    user, is_new = await otp.verify_code(db, payload.phone, payload.code)
    tokens = await start_session(db, user, response)
    return LoginResponse(
        tokens=tokens, user=await build_user_payload(db, user), is_new=is_new
    )


async def set_active_business(
    db: AsyncSession, user: User, business_id: UUID
) -> UserResponse:
    """Switch which business the person is working in."""
    target = await db.scalar(
        select(CompanyMembership).where(
            CompanyMembership.user_id == user.id,
            CompanyMembership.company_id == business_id,
        )
    )
    if target is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You're not part of this business.",
        )
    await activate_membership(db, target)
    await db.commit()
    await invalidate_profile_read_caches(str(user.id))
    await redis_service.delete(f"company:detail:{user.id}")
    return await build_user_payload(db, user)


async def login(
    db: AsyncSession, payload: LoginRequest, response: Response
) -> LoginResponse:
    """Verify email and password, start a session and return the person."""
    result = await db.execute(
        select(User).where(func.lower(User.email) == normalize_email(payload.email))
    )
    user = result.scalar_one_or_none()

    if not user or not await verify_password_async(
        user.password_hash, payload.password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    if user.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "account_deleted",
                "message": "This account has been deleted",
            },
        )

    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "email_not_verified",
                "message": "Please verify your email before logging in",
            },
        )

    tokens = await start_session(db, user, response)
    return LoginResponse(tokens=tokens, user=await build_user_payload(db, user))


async def login_swagger(db: AsyncSession, payload: OAuth2PasswordRequestForm) -> dict:
    """Verify credentials and return access token (Swagger UI compatibility)."""
    result = await db.execute(
        select(User).where(func.lower(User.email) == normalize_email(payload.username))
    )
    user = result.scalar_one_or_none()

    if not user or not await verify_password_async(
        user.password_hash, payload.password
    ):
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
    await create_custom_audit_log(
        db,
        entity_type="session",
        action_type="recruiter_login",
        category="auth",
        message=f"{user.full_name} logged in",
        entity_id=jti,
        target_user_id=user.id,
        company_id=await _get_active_company_id_for_user(db, user.id),
        metadata={"email": user.email},
    )
    await db.commit()

    # Swagger REQUIREMENT: Must return access_token and token_type keys
    return {"access_token": tokens["access_token"], "token_type": "bearer"}


async def refresh_tokens(
    db: AsyncSession, refresh_token: str | None, response: Response
) -> dict:
    """Validate and rotate refresh token, return new access token."""
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

    owner = await db.get(User, token_row.user_id)
    if owner is None or owner.is_deleted:
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Account unavailable"
        )

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
        path="/",
        expires=new_expires_at,
    )

    # 8. Remove refresh_token from the JSON body
    # The frontend only receives the access_token in the response body
    new_tokens.pop("refresh_token")

    return new_tokens


async def logout(
    db: AsyncSession, refresh_token: str | None, response: Response
) -> dict:
    """Revoke refresh token and clear authentication cookie."""
    # 1. Delete from DB (only if a token was provided — handles already-logged-out users)
    if refresh_token:
        decoded = decode_refresh_token(refresh_token)
        if decoded:
            user_id, jti = decoded
            await db.execute(delete(RefreshToken).where(RefreshToken.jti == jti))
            await create_custom_audit_log(
                db,
                entity_type="session",
                action_type="recruiter_logout",
                category="auth",
                message="Recruiter logged out",
                entity_id=jti,
                target_user_id=user_id,
                company_id=await _get_active_company_id_for_user(db, user_id),
            )
            await db.commit()

    # 2. Clear the cookie from the browser
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}


async def forgot_password(
    db: AsyncSession, payload: ForgotPasswordRequest, bg_tasks: BackgroundTasks
) -> dict:
    """Generate reset token and send password reset email (if user exists)."""
    result = await db.execute(
        select(User).where(func.lower(User.email) == normalize_email(payload.email))
    )
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
        bg_tasks.add_task(EmailService.send_password_reset, user.email, reset_token)

    return {"message": "If that email exists, a reset link has been sent"}


async def reset_password(db: AsyncSession, payload: ResetPasswordRequest) -> dict:
    """Validate reset token and update password, revoke all refresh tokens."""
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

    user.password_hash = await hash_password_async(payload.new_password)
    user.password_reset_token = None
    user.password_reset_expires_at = None

    # revoke all refresh tokens on password reset — force re-login everywhere
    await db.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id))
    bind_actor(actor_user_id=user.id, actor_role=actor_role(user))
    await db.commit()

    logger.info(f"Password reset successful: {user.email}")
    return {"message": "Password reset successfully. Please log in again."}


async def delete_my_account(
    db: AsyncSession,
    user: User,
    response: Response,
) -> None:
    """Soft-delete the user's account: marks deleted, revokes all sessions, clears cookie."""
    user.is_deleted = True
    user.deleted_at = datetime.now(timezone.utc)
    await db.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id))
    response.delete_cookie("refresh_token", path="/")
    await db.commit()
    logger.info(f"Account deleted: {user.email}")

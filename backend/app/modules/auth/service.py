import secrets
from datetime import datetime, timedelta, timezone

from fastapi import BackgroundTasks, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from loguru import logger
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.infrastructures.email.service import EmailService
from app.core.security import (
    create_tokens,
    create_pending_signup_token,
    decode_pending_signup_token,
    decode_refresh_token,
    decode_signup_token,
    hash_password,
    verify_password,
)
from app.modules.auth.enums import MembershipRole, MembershipStatus, UserRole
from app.modules.auth.models import (
    OAuthAccount,
    RefreshToken,
    User,
)
from app.modules.companies.models import Company, CompanyMembership
from app.modules.auth.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    GoogleRegisterRequest,
    LoginRequest,
    ResetPasswordRequest,
    SignupData,
    SignupRequest,
    UpdateMeRequest,
    UserResponse,
    VerifyEmailRequest,
)
from app.modules.auth.utils import build_user_dict, get_membership_status


async def get_me_data(db: AsyncSession, user: User) -> UserResponse:
    """Return authenticated user's profile with membership status."""
    ms = await get_membership_status(db, user)
    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        primary_role=user.primary_role,
        is_email_verified=user.is_email_verified,
        is_onboarded=user.is_onboarded,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        membership_status=ms,
    )


async def update_me_data(
    db: AsyncSession, user: User, payload: UpdateMeRequest
) -> UserResponse:
    user.full_name = payload.full_name.strip()
    await db.commit()
    await db.refresh(user)
    return await get_me_data(db, user)


async def change_password(
    db: AsyncSession, user: User, payload: ChangePasswordRequest
) -> None:
    if user.password_hash:
        if not payload.current_password or not verify_password(
            user.password_hash, payload.current_password
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect.",
            )

    user.password_hash = hash_password(payload.new_password)
    await db.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id))
    await db.commit()


async def signup(
    db: AsyncSession, payload: SignupRequest, bg_tasks: BackgroundTasks
) -> SignupData:
    """Validate email uniqueness, generate pending-signup token, and send verification email."""
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    # Build the common pending data shared by all roles.
    pending_data = {
        "full_name": payload.full_name,
        "email": payload.email,
        "password_hash": hash_password(payload.password),
        "primary_role": payload.primary_role.value,
    }

    if payload.primary_role == UserRole.candidate:
        # Candidates: send verification email immediately; no setup step needed.
        pending_data["type"] = "pending_candidate"
        token = create_pending_signup_token(pending_data)
        bg_tasks.add_task(EmailService.send_verification, payload.email, token)
        logger.info(f"Candidate signup initiated for {payload.email}")
        return SignupData(setup_token=None)
    else:
        # Recruiters / admins: no email sent yet.
        # The setup_token is used to attach company details before the first
        # and only verification email is dispatched by the company endpoints.
        pending_data["type"] = "setup"
        token = create_pending_signup_token(pending_data)
        logger.info(
            f"Recruiter/admin signup initiated for {payload.email} (awaiting company step)"
        )
        return SignupData(setup_token=token)


async def verify_email(db: AsyncSession, payload: VerifyEmailRequest) -> None:
    """Decode token from email link and create verified user (+ company/membership if applicable)."""
    data = decode_pending_signup_token(payload.token)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification link. Please sign up again.",
        )

    email: str = data["email"]

    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        logger.info(f"Duplicate verify-email click ignored for {email}")
        return

    is_recruiter = UserRole(data["primary_role"]) in (
        UserRole.recruiter,
        UserRole.recruiter_admin,
    )
    user = User(
        full_name=data["full_name"],
        email=email,
        password_hash=data.get("password_hash"),
        primary_role=UserRole(data["primary_role"]),
        avatar_url=data.get("avatar_url"),
        is_email_verified=True,
        is_onboarded=is_recruiter,  # recruiters are onboarded on company setup
    )
    db.add(user)
    await db.flush()  # generate user.id before creating related rows

    # Link OAuth account if this originated from a Google signup
    if data.get("google_id"):
        db.add(
            OAuthAccount(
                user_id=user.id,
                provider="google",
                provider_account_id=data["google_id"],
            )
        )

    token_type: str = data.get("type", "")

    if token_type == "pending_company" and data.get("company_name"):
        company = Company(
            name=data["company_name"],
            industry=data.get("industry"),
            company_size=data.get("company_size"),
            website_url=data.get("website"),
            location=data.get("location"),
            description=data.get("description"),
        )
        db.add(company)
        await db.flush()
        db.add(
            CompanyMembership(
                user_id=user.id,
                company_id=company.id,
                role=MembershipRole.admin,
                status=MembershipStatus.active,
            )
        )
        logger.info(f"Company '{company.name}' created for {email} on verification")

    elif token_type == "pending_recruiter" and data.get("join_company_name"):
        company_result = await db.execute(
            select(Company).where(Company.name == data["join_company_name"])
        )
        company = company_result.scalar_one_or_none()
        if company:
            db.add(
                CompanyMembership(
                    user_id=user.id,
                    company_id=company.id,
                    role=MembershipRole.recruiter,
                    status=MembershipStatus.pending,
                )
            )
            logger.info(
                f"Recruiter {email} pending join for '{data['join_company_name']}' created"
            )

    await db.commit()
    logger.info(f"User created via email verification: {email}")


async def login(db: AsyncSession, payload: LoginRequest, response: Response) -> dict:
    """Verify credentials, create tokens, set refresh cookie, and return user data."""
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

    user_dict = await build_user_dict(db, user)
    return {"tokens": tokens, "user": user_dict}


async def google_register(
    db: AsyncSession, payload: GoogleRegisterRequest, response: Response
) -> dict:
    """Validate signup token, create user from Google data, and return logged-in user + tokens.

    For non-candidate roles the user is NOT created immediately.
    Instead a ``setup`` token is returned so the frontend can redirect
    the user to the Company Registration / Join-Company step first.
    """
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

    # ---- Non-candidate: defer user creation until company step is done ----
    if payload.primary_role in (UserRole.recruiter, UserRole.recruiter_admin):
        pending_data = {
            "type": "setup",
            "full_name": data["full_name"],
            "email": data["email"],
            "google_id": data["google_id"],
            "avatar_url": data.get("avatar_url"),
            "password_hash": None,  # social users have no password
            "primary_role": payload.primary_role.value,
        }
        setup_token = create_pending_signup_token(pending_data)
        logger.info(
            f"Google recruiter/admin signup deferred for {data['email']} (awaiting company step)"
        )
        return {"action": "requires_setup", "setup_token": setup_token}

    # ---- Candidate: create user immediately (is_onboarded=False until onboarding step) ----
    user = User(
        full_name=data["full_name"],
        email=data["email"],
        avatar_url=data.get("avatar_url"),
        is_email_verified=True,
        is_onboarded=False,
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
    user_dict = await build_user_dict(db, user)
    return {"tokens": tokens, "user": user_dict}


async def login_swagger(db: AsyncSession, payload: OAuth2PasswordRequestForm) -> dict:
    """Verify credentials and return access token (Swagger UI compatibility)."""
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
    """Revoke refresh token and clear authentication cookie."""
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
    """Generate reset token and send password reset email (if user exists)."""
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

    user.password_hash = hash_password(payload.new_password)
    user.password_reset_token = None
    user.password_reset_expires_at = None

    # revoke all refresh tokens on password reset — force re-login everywhere
    await db.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id))
    await db.commit()

    logger.info(f"Password reset successful: {user.email}")
    return {"message": "Password reset successfully. Please log in again."}

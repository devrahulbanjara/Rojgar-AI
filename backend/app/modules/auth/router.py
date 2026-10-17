import secrets
from typing import Annotated

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Cookie,
    Depends,
    File,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from loguru import logger

from app.core.config import settings
from app.core.database import release_connection
from app.core.dependencies import CurrentUser, DbSession
from app.core.rate_limit import RateLimit
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.infrastructures.storage.service import storage_service
from app.modules.auth import otp, service
from app.modules.auth.oauth import (
    get_google_auth_url,
    google_oauth_callback,
)
from app.modules.auth.schemas import (
    ActiveBusinessRequest,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    OtpRequest,
    OtpVerifyRequest,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
    UpdateMeRequest,
    UserResponse,
    VerifyEmailRequest,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/signup",
    status_code=status.HTTP_201_CREATED,
    summary="Email sign-up: sends the verification link",
    dependencies=[Depends(RateLimit("auth.signup", 5, 300, per_email=3))],
)
async def signup(
    payload: SignupRequest,
    bg_tasks: BackgroundTasks,
    db: DbSession,
) -> UnifiedResponse[None]:
    """Start the email sign-up flow."""
    await service.signup(db, payload, bg_tasks)
    return ResponseBuilder.success(
        message="Please verify your email.",
        status_code=status.HTTP_201_CREATED,
    )


@router.post(
    "/otp/request",
    summary="Text a 6-digit sign-in code to a Nepali mobile number",
    dependencies=[Depends(RateLimit("auth.otp_request", 10, 600))],
)
async def request_phone_code(
    payload: OtpRequest, db: DbSession
) -> UnifiedResponse[None]:
    """Send a sign-in code by SMS (works for new and existing people)."""
    await otp.request_code(db, payload.phone)
    return ResponseBuilder.success(message="Code sent.")


@router.post(
    "/otp/verify",
    summary="Sign in or sign up with the SMS code; sets the session cookie",
    dependencies=[Depends(RateLimit("auth.otp_verify", 20, 600))],
)
async def verify_phone_code(
    payload: OtpVerifyRequest, response: Response, db: DbSession
) -> UnifiedResponse[LoginResponse]:
    """Check the code and start a session."""
    result = await service.verify_phone_code(db, payload, response)
    return ResponseBuilder.success(data=result, message="Signed in", response=response)


@router.post(
    "/verify-email",
    summary="Complete account creation after email verification",
    dependencies=[Depends(RateLimit("auth.verify_email", 10, 60))],
)
async def verify_email(
    payload: VerifyEmailRequest, db: DbSession
) -> UnifiedResponse[None]:
    """Complete account creation from an email verification token."""
    await service.verify_email(db, payload)
    return ResponseBuilder.success(message="Email verified successfully")


@router.post(
    "/login",
    summary="Authenticate with email and password, return access and refresh tokens",
    dependencies=[Depends(RateLimit("auth.login", 10, 60, per_email=5))],
)
async def login(
    payload: LoginRequest, response: Response, db: DbSession
) -> UnifiedResponse[LoginResponse]:
    """Authenticate a user and issue tokens."""
    result = await service.login(db, payload, response)
    return ResponseBuilder.success(
        data=result,
        message="Login successful",
        response=response,
    )


@router.post(
    "/refresh",
    summary="Refresh expired access token using refresh token cookie",
    dependencies=[Depends(RateLimit("auth.refresh", 30, 60))],
)
async def refresh(
    response: Response,
    refresh_token: Annotated[str | None, Cookie()] = None,
    db: DbSession = None,
) -> UnifiedResponse[TokenResponse]:
    """Rotate the refresh token and return a new access token."""
    result = await service.refresh_tokens(db, refresh_token, response)
    return ResponseBuilder.success(
        data=result,
        message="Tokens refreshed",
        response=response,
    )


@router.post(
    "/logout",
    summary="Invalidate refresh token and clear authentication cookies",
)
async def logout(
    response: Response,
    refresh_token: Annotated[str | None, Cookie()] = None,
    db: DbSession = None,
) -> UnifiedResponse[None]:
    """Log out the current user and clear their refresh cookie."""
    await service.logout(db, refresh_token, response)
    return ResponseBuilder.success(message="Logged out successfully", response=response)


@router.post(
    "/forgot-password",
    summary="Initiate password reset flow: sends reset link to email",
    dependencies=[Depends(RateLimit("auth.forgot_password", 3, 600, per_email=2))],
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    bg_tasks: BackgroundTasks,
    db: DbSession,
) -> UnifiedResponse[None]:
    """Start the password reset flow for an email address."""
    await service.forgot_password(db, payload, bg_tasks)
    return ResponseBuilder.success(
        message="If that email exists, a reset link has been sent"
    )


@router.post(
    "/reset-password",
    summary="Complete password reset using token from reset link",
    dependencies=[Depends(RateLimit("auth.reset_password", 5, 60))],
)
async def reset_password(
    payload: ResetPasswordRequest, db: DbSession
) -> UnifiedResponse[None]:
    """Complete a password reset using a reset token."""
    await service.reset_password(db, payload)
    return ResponseBuilder.success(
        message="Password reset successfully. Please log in again."
    )


# --- Swagger UI Auth Bridge ---


@router.post("/login-swagger", include_in_schema=False)
async def login_swagger(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: DbSession = None,
):
    """Authenticate Swagger UI and return a bearer token payload (dev only)."""
    if settings.environment != "dev":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")
    return await service.login_swagger(db, form_data)


# --- Protected Routes ---


@router.get(
    "/me",
    summary="Get authenticated user's profile information",
)
async def get_me(
    current_user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[UserResponse]:
    """Return the authenticated user's profile payload."""
    data = await service.get_me_data(db, current_user)
    return ResponseBuilder.success(data=data, message="Profile retrieved")


@router.post(
    "/me/active-business",
    summary="Switch the business the signed-in person is working in",
)
async def set_active_business(
    payload: ActiveBusinessRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[UserResponse]:
    """Make one of the person's businesses the active one."""
    data = await service.set_active_business(db, current_user, payload.business_id)
    return ResponseBuilder.success(data=data, message="Business switched")


@router.patch(
    "/me",
    summary="Update authenticated user's basic profile information",
)
async def update_me(
    payload: UpdateMeRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[UserResponse]:
    """Update the authenticated user's basic profile fields."""
    data = await service.update_me_data(db, current_user, payload)
    await service.invalidate_user_read_caches(db, current_user)
    return ResponseBuilder.success(data=data, message="Profile updated")


@router.patch(
    "/me/avatar",
    summary="Upload or replace the authenticated user's avatar",
)
async def upload_my_avatar(
    file: UploadFile = File(),
    current_user: CurrentUser = None,
    db: DbSession = None,
) -> UnifiedResponse[UserResponse]:
    """Upload or replace the authenticated user's avatar image."""
    previous_avatar_url = current_user.avatar_url
    await release_connection(db)  # no pooled connection during the S3 upload
    new_avatar_url = await storage_service.upload_image(file, folder="avatars")
    current_user.avatar_url = new_avatar_url
    await db.commit()
    await db.refresh(current_user)

    if previous_avatar_url and previous_avatar_url != new_avatar_url:
        await storage_service.delete_image(previous_avatar_url)

    await service.invalidate_user_read_caches(db, current_user)

    data = await service.get_me_data(db, current_user)
    return ResponseBuilder.success(data=data, message="Avatar updated")


@router.delete(
    "/me",
    summary="Permanently delete the authenticated user's account",
)
async def delete_my_account(
    response: Response,
    current_user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[None]:
    """Soft-delete the authenticated user's account."""
    await service.delete_my_account(db, current_user, response)
    return ResponseBuilder.success(message="Account deleted", response=response)


@router.delete(
    "/me/avatar",
    summary="Delete the authenticated user's avatar",
)
async def delete_my_avatar(
    current_user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[None]:
    """Remove the authenticated user's avatar image."""
    previous_avatar_url = current_user.avatar_url
    current_user.avatar_url = None
    await db.commit()
    await db.refresh(current_user)

    if previous_avatar_url:
        await storage_service.delete_image(previous_avatar_url)

    await service.invalidate_user_read_caches(db, current_user)

    return ResponseBuilder.success(data=None, message="Avatar removed.")


@router.patch(
    "/me/password",
    summary="Change authenticated user's password",
)
async def update_my_password(
    payload: ChangePasswordRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[None]:
    """Change the authenticated user's password."""
    await service.change_password(db, current_user, payload)
    return ResponseBuilder.success(
        data=None,
        message="Password updated. Please log in again on other devices.",
    )


# --- Google OAuth ---


@router.get(
    "/google",
    summary="Initiate Google OAuth flow: redirects to Google login",
)
async def google_login():
    """Start the Google OAuth flow and set the CSRF state cookie."""
    csrf_token = secrets.token_urlsafe(16)
    url = get_google_auth_url(csrf_token)

    response = RedirectResponse(url)
    response.set_cookie(
        key="oauth_state",
        value=csrf_token,
        httponly=True,
        max_age=600,
        samesite="lax",
        path="/",
    )
    return response


@router.get(
    "/google/callback",
    summary="Handle Google OAuth callback: signs the person in (creates them if new)",
)
async def google_callback(
    code: str,
    state: str,
    oauth_state: Annotated[str | None, Cookie()] = None,
    db: DbSession = None,
):
    """Handle the Google OAuth callback and redirect the frontend."""
    # 1. state IS the raw CSRF token — compare directly
    if not oauth_state or state != oauth_state:
        return RedirectResponse(f"{settings.frontend_url}/login?error=invalid_state")

    redirect_resp = RedirectResponse(url=f"{settings.frontend_url}/auth/oauth-callback")
    redirect_resp.delete_cookie("oauth_state", path="/")
    # The HttpOnly refresh cookie is set on redirect_resp. Never put the access
    # token in the URL; the frontend calls /auth/refresh and then /auth/me.
    try:
        await google_oauth_callback(db, code, redirect_resp)
    except Exception:
        logger.exception("Google OAuth callback error")
        redirect_resp.headers["location"] = (
            f"{settings.frontend_url}/login?error=oauth_failed"
        )
    return redirect_resp

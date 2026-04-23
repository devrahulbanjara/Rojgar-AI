import secrets

from loguru import logger
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Cookie,
    Depends,
    File,
    Response,
    UploadFile,
    status,
)
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_limiter.depends import RateLimiter
from pyrate_limiter import Duration, Limiter, Rate
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.infrastructures.storage.service import storage_service
from app.modules.auth import service
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.auth.oauth import (
    get_google_auth_url,
    google_oauth_callback,
)
from app.modules.auth.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    GoogleRegisterRequest,
    LoginRequest,
    LoginResponse,
    ResetPasswordRequest,
    SignupData,
    SignupRequest,
    TokenResponse,
    UpdateMeRequest,
    UserResponse,
    VerifyEmailRequest,
)

router = APIRouter()

db = Depends(get_db)


@router.post(
    "/signup",
    response_model=UnifiedResponse[SignupData],
    status_code=status.HTTP_201_CREATED,
    summary="Stage 1 of local signup: validates credentials and sends verification email",
    dependencies=[Depends(RateLimiter(limiter=Limiter(Rate(5, Duration.MINUTE * 5))))],
)
async def signup(
    payload: SignupRequest,
    bg_tasks: BackgroundTasks,
    db: AsyncSession = db,
):
    """Start the local signup flow for a new user."""
    data = await service.signup(db, payload, bg_tasks)
    return ResponseBuilder.success(
        data=data,
        message="Account created. Please verify your email.",
        status_code=status.HTTP_201_CREATED,
    )


@router.post(
    "/verify-email",
    response_model=UnifiedResponse[None],
    summary="Complete account creation after email verification",
    dependencies=[Depends(RateLimiter(limiter=Limiter(Rate(10, Duration.MINUTE))))],
)
async def verify_email(payload: VerifyEmailRequest, db: AsyncSession = db):
    """Complete account creation from an email verification token."""
    await service.verify_email(db, payload)
    return ResponseBuilder.success(message="Email verified successfully")


@router.post(
    "/login",
    response_model=UnifiedResponse[LoginResponse],
    summary="Authenticate with email and password, return access and refresh tokens",
    dependencies=[Depends(RateLimiter(limiter=Limiter(Rate(10, Duration.MINUTE))))],
)
async def login(payload: LoginRequest, response: Response, db: AsyncSession = db):
    """Authenticate a user and issue tokens."""
    result = await service.login(db, payload, response)
    return ResponseBuilder.success(
        data=result,
        message="Login successful",
        response=response,
    )


@router.post(
    "/refresh",
    response_model=UnifiedResponse[TokenResponse],
    summary="Refresh expired access token using refresh token cookie",
    dependencies=[Depends(RateLimiter(limiter=Limiter(Rate(30, Duration.MINUTE))))],
)
async def refresh(
    response: Response,
    refresh_token: str | None = Cookie(None),
    db: AsyncSession = db,
):
    """Rotate the refresh token and return a new access token."""
    result = await service.refresh_tokens(db, refresh_token, response)
    return ResponseBuilder.success(
        data=result,
        message="Tokens refreshed",
        response=response,
    )


@router.post(
    "/logout",
    response_model=UnifiedResponse[None],
    summary="Invalidate refresh token and clear authentication cookies",
)
async def logout(
    response: Response,
    refresh_token: str | None = Cookie(None),
    db: AsyncSession = db,
):
    """Log out the current user and clear their refresh cookie."""
    await service.logout(db, refresh_token, response)
    return ResponseBuilder.success(message="Logged out successfully", response=response)


@router.post(
    "/forgot-password",
    response_model=UnifiedResponse[None],
    summary="Initiate password reset flow: sends reset link to email",
    dependencies=[Depends(RateLimiter(limiter=Limiter(Rate(3, Duration.MINUTE * 10))))],
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    bg_tasks: BackgroundTasks,
    db: AsyncSession = db,
):
    """Start the password reset flow for an email address."""
    await service.forgot_password(db, payload, bg_tasks)
    return ResponseBuilder.success(
        message="If that email exists, a reset link has been sent"
    )


@router.post(
    "/reset-password",
    response_model=UnifiedResponse[None],
    summary="Complete password reset using token from reset link",
    dependencies=[Depends(RateLimiter(limiter=Limiter(Rate(5, Duration.MINUTE))))],
)
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = db):
    """Complete a password reset using a reset token."""
    await service.reset_password(db, payload)
    return ResponseBuilder.success(
        message="Password reset successfully. Please log in again."
    )


# --- Swagger UI Auth Bridge ---


@router.post("/login-swagger", include_in_schema=False)
async def login_swagger(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = db,
):
    """Authenticate Swagger UI and return a bearer token payload."""
    return await service.login_swagger(db, form_data)


# --- Protected Routes ---


@router.get(
    "/me",
    response_model=UnifiedResponse[UserResponse],
    summary="Get authenticated user's profile information",
)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = db,
):
    """Return the authenticated user's profile payload."""
    data = await service.get_me_data(db, current_user)
    return ResponseBuilder.success(data=data, message="Profile retrieved")


@router.patch(
    "/me",
    response_model=UnifiedResponse[UserResponse],
    summary="Update authenticated user's basic profile information",
)
async def update_me(
    payload: UpdateMeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = db,
):
    """Update the authenticated user's basic profile fields."""
    data = await service.update_me_data(db, current_user, payload)
    await service.invalidate_user_read_caches(db, current_user)
    return ResponseBuilder.success(data=data, message="Profile updated")


@router.patch(
    "/me/avatar",
    response_model=UnifiedResponse[UserResponse],
    summary="Upload or replace the authenticated user's avatar",
)
async def upload_my_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = db,
):
    """Upload or replace the authenticated user's avatar image."""
    previous_avatar_url = current_user.avatar_url
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
    response_model=UnifiedResponse[None],
    summary="Permanently delete the authenticated user's account",
)
async def delete_my_account(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = db,
):
    """Soft-delete the authenticated user's account."""
    await service.delete_my_account(db, current_user, response)
    return ResponseBuilder.success(message="Account deleted", response=response)


@router.delete(
    "/me/avatar",
    response_model=UnifiedResponse[None],
    summary="Delete the authenticated user's avatar",
)
async def delete_my_avatar(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = db,
):
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
    response_model=UnifiedResponse[None],
    summary="Change authenticated user's password",
)
async def update_my_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = db,
):
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
    )
    return response


@router.get(
    "/google/callback",
    summary="Handle Google OAuth callback: creates or logs in user",
)
async def google_callback(
    code: str,
    state: str,
    oauth_state: str | None = Cookie(None),
    db: AsyncSession = db,
):
    """Handle the Google OAuth callback and redirect the frontend."""
    import json
    from urllib.parse import urlencode

    from app.core.config import settings

    # 1. state IS the raw CSRF token — compare directly
    if not oauth_state or state != oauth_state:
        return RedirectResponse(f"{settings.frontend_url}/login?error=invalid_state")

    # Create the redirect response object first so oauth logic can set cookies on it
    redirect_resp = RedirectResponse(url="/")

    # 2. Clean up the CSRF cookie immediately
    redirect_resp.delete_cookie("oauth_state")

    # 3. Run the OAuth callback logic (new users receive a signup_token; existing users are logged in)
    try:
        result = await google_oauth_callback(db, code, redirect_resp)
    except Exception:
        logger.exception("Google OAuth callback error")
        redirect_resp.headers["location"] = (
            f"{settings.frontend_url}/login?error=oauth_failed"
        )
        return redirect_resp

    params = {}
    if result["action"] == "login":
        params["access_token"] = result["tokens"]["access_token"]
        user_schema = UserResponse.model_validate(result["user"]).model_dump(
            mode="json"
        )
        params["user"] = json.dumps(user_schema)
    else:
        params["setup_token"] = result["signup_token"]
        params["user_info"] = json.dumps(result["user_info"])
        params["action"] = "requires_setup"

    redirect_resp.headers["location"] = (
        f"{settings.frontend_url}/auth/oauth-callback?{urlencode(params)}"
    )
    return redirect_resp


@router.post(
    "/google/register",
    response_model=UnifiedResponse[LoginResponse | SignupData],
    status_code=status.HTTP_201_CREATED,
    summary="Complete two-phase Google signup: consume signup_token and create account",
    dependencies=[Depends(RateLimiter(limiter=Limiter(Rate(5, Duration.MINUTE * 5))))],
)
async def google_register(
    payload: GoogleRegisterRequest,
    response: Response,
    db: AsyncSession = db,
):
    """Complete a Google signup flow after role selection."""
    result = await service.google_register(db, payload, response)
    return ResponseBuilder.success(
        data=result,
        message="Account created successfully",
        status_code=status.HTTP_201_CREATED,
        response=response,
    )

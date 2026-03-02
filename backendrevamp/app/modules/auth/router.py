import secrets
from fastapi import APIRouter, Depends, status, Response, Cookie, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.auth import service
from app.modules.auth.oauth import get_google_auth_url, google_oauth_callback
from app.modules.auth.schemas import (
    SignupRequest,
    LoginRequest,
    LoginResponse,
    TokenResponse,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
)
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User

router = APIRouter()

db = Depends(get_db)


@router.post(
    "/signup", response_model=UnifiedResponse[None], status_code=status.HTTP_201_CREATED
)
async def signup(payload: SignupRequest, db: AsyncSession = db):
    await service.signup(db, payload)
    return ResponseBuilder.success(
        message="Account created. Please verify your email.",
        status_code=status.HTTP_201_CREATED,
    )


@router.post("/verify-email", response_model=UnifiedResponse[None])
async def verify_email(payload: VerifyEmailRequest, db: AsyncSession = db):
    await service.verify_email(db, payload)
    return ResponseBuilder.success(message="Email verified successfully")


@router.post("/login", response_model=UnifiedResponse[LoginResponse])
async def login(payload: LoginRequest, response: Response, db: AsyncSession = db):
    result = await service.login(db, payload, response)
    return ResponseBuilder.success(data=result, message="Login successful")


@router.post("/refresh", response_model=UnifiedResponse[TokenResponse])
async def refresh(
    response: Response, refresh_token: str | None = Cookie(None), db: AsyncSession = db
):
    result = await service.refresh_tokens(db, refresh_token, response)
    return ResponseBuilder.success(data=result, message="Tokens refreshed")


@router.post("/logout", response_model=UnifiedResponse[None])
async def logout(
    response: Response, refresh_token: str | None = Cookie(None), db: AsyncSession = db
):
    await service.logout(db, refresh_token, response)
    return ResponseBuilder.success(message="Logged out successfully")


@router.post("/forgot-password", response_model=UnifiedResponse[None])
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = db):
    await service.forgot_password(db, payload)
    return ResponseBuilder.success(
        message="If that email exists, a reset link has been sent"
    )


@router.post("/reset-password", response_model=UnifiedResponse[None])
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = db):
    await service.reset_password(db, payload)
    return ResponseBuilder.success(
        message="Password reset successfully. Please log in again."
    )


# --- Swagger UI Auth Bridge ---


@router.post("/login-swagger", include_in_schema=False)
async def login_swagger(
    form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = db
):
    return await service.login_swagger(db, form_data)


# --- Protected Routes ---


@router.get("/me", response_model=UnifiedResponse[UserResponse])
async def get_me(current_user: User = Depends(get_current_user)):
    return ResponseBuilder.success(data=current_user, message="Profile retrieved")


# --- Google OAuth ---


@router.get("/google")
async def google_login(response: Response):
    state = secrets.token_urlsafe(16)
    # Store state in a temporary cookie for 10 minutes to prevent CSRF
    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        max_age=600,
        samesite="lax",
    )
    url = get_google_auth_url(state)
    return RedirectResponse(url)


@router.get("/google/callback")
async def google_callback(
    code: str,
    state: str,
    response: Response,
    oauth_state: str | None = Cookie(None),
    db: AsyncSession = db,
):
    # Verify the state matches to prevent CSRF attacks
    if not oauth_state or state != oauth_state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    result = await google_oauth_callback(db, code, response)
    response.delete_cookie("oauth_state")  # Clean up
    return ResponseBuilder.success(data=result, message="Google login successful")

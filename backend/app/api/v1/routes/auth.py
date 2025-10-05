"""
Authentication routes
"""

from fastapi import APIRouter, HTTPException, status, Depends, Response
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode
import httpx

from app.core.config import settings
from app.core.security import get_current_user_id
from app.schemas.user import (
    TokenResponse,
    GoogleUserInfo,
    RoleSelectionRequest,
    LoginRequest,
    SignupRequest,
)
from app.services.auth_service import auth_service

router = APIRouter()


@router.get("/google")
async def google_login():
    """Initiate Google OAuth login"""
    google_auth_url = "https://accounts.google.com/o/oauth2/auth"
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": f"{settings.BACKEND_URL}/auth/google/callback",
        "scope": "openid email profile",
        "response_type": "code",
        "access_type": "offline",
        "prompt": "consent",
    }

    auth_url = f"{google_auth_url}?{urlencode(params)}"
    return {"auth_url": auth_url}


@router.get("/google/callback")
async def google_callback(code: str):
    """Handle Google OAuth callback"""
    try:
        # Exchange code for tokens
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": f"{settings.BACKEND_URL}/auth/google/callback",
                },
            )

            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange code for tokens",
                )

            tokens = token_response.json()
            access_token = tokens.get("access_token")

            # Get user info from Google
            user_response = await client.get(
                f"https://www.googleapis.com/oauth2/v1/userinfo?access_token={access_token}"
            )

            if user_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user info from Google",
                )

            google_user = GoogleUserInfo(**user_response.json())

            # Authenticate user
            token_data = auth_service.authenticate_with_google(google_user)

            # Create redirect response with cookie
            if token_data.user.role:
                redirect_url = (
                    f"{settings.FRONTEND_URL}/dashboard/{token_data.user.role.value}"
                )
            else:
                redirect_url = f"{settings.FRONTEND_URL}/select-role"

            response = RedirectResponse(url=redirect_url)
            response.set_cookie(
                key="auth_token",
                value=token_data.access_token,
                max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                httponly=True,
                secure=False,  # Set to True in production with HTTPS
                samesite="lax",
            )
            return response

    except Exception as e:
        # Redirect to frontend with error
        error_url = f"{settings.FRONTEND_URL}/login?error=auth_failed"
        return RedirectResponse(url=error_url)


@router.post("/google/token", response_model=TokenResponse)
async def google_token_auth(google_token: str):
    """Authenticate with Google token (for frontend use)"""
    google_user = await auth_service.verify_google_token(google_token)
    return auth_service.authenticate_with_google(google_user)


@router.post("/signup", response_model=TokenResponse)
async def signup_with_email(signup_data: SignupRequest, response: Response):
    """Sign up with email and password"""
    token_data = auth_service.signup_with_email(signup_data)

    # Set cookie
    response.set_cookie(
        key="auth_token",
        value=token_data.access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
    )
    return token_data


@router.post("/login", response_model=TokenResponse)
async def login_with_email(login_data: LoginRequest, response: Response):
    """Login with email and password"""
    token_data = auth_service.login_with_email(login_data)

    # Set cookie with appropriate expiration
    if login_data.remember_me:
        # Remember me: 30 days
        cookie_max_age = 30 * 24 * 60 * 60  # 30 days in seconds
    else:
        # Regular session: default expiration
        cookie_max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    response.set_cookie(
        key="auth_token",
        value=token_data.access_token,
        max_age=cookie_max_age,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
    )
    return token_data


@router.post("/select-role")
async def select_role(
    role_data: RoleSelectionRequest, current_user_id: str = Depends(get_current_user_id)
):
    """Select user role after authentication"""
    user_response = auth_service.select_role(current_user_id, role_data.role)

    # Return response with redirect URL
    return {"user": user_response, "redirect_url": f"/dashboard/{role_data.role.value}"}


@router.post("/logout")
async def logout(response: Response):
    """Logout endpoint (clear cookie)"""
    response.delete_cookie(key="auth_token")
    return {"message": "Logged out successfully"}

from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, Response, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_signup_token, create_tokens
from app.modules.auth.models import OAuthAccount, RefreshToken, User

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


def get_google_auth_url(csrf_token: str) -> str:
    """Build the Google OAuth URL using the raw CSRF token as the state param."""
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": csrf_token,
        "access_type": "offline",
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"


async def exchange_google_code(code: str) -> dict:
    """Exchange a Google OAuth authorisation code for token data."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        resp.raise_for_status()
        return resp.json()


async def get_google_user_info(access_token: str) -> dict:
    """Fetch the Google userinfo payload for a valid access token."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        resp.raise_for_status()
        return resp.json()


async def google_oauth_callback(
    db: AsyncSession,
    code: str,
    response: Response,
) -> dict:
    """Handle the Google OAuth callback for existing and new users."""
    # 1. Exchange code for tokens and fetch Google user info
    try:
        token_data = await exchange_google_code(code)
        user_info = await get_google_user_info(token_data["access_token"])
    except httpx.HTTPError as e:
        logger.error(f"Google OAuth HTTP error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to authenticate with Google",
        )

    google_id: str = user_info["sub"]
    email: str = user_info["email"]
    full_name: str = user_info.get("name", "")
    avatar_url: str | None = user_info.get("picture")

    # 2. Check if a user with this email already exists
    user_result = await db.execute(select(User).where(User.email == email))
    user = user_result.scalar_one_or_none()

    if user:
        # CASE 1: Existing user — log them in immediately.
        # Also link this Google account if it hasn’t been linked before.
        oauth_result = await db.execute(
            select(OAuthAccount).where(
                OAuthAccount.provider == "google",
                OAuthAccount.provider_account_id == google_id,
            )
        )
        if not oauth_result.scalar_one_or_none():
            db.add(
                OAuthAccount(
                    user_id=user.id,
                    provider="google",
                    provider_account_id=google_id,
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

        tokens.pop("refresh_token")
        return {"action": "login", "tokens": tokens, "user": user}

    else:
        # CASE 2: New user — do NOT write to the DB.
        # Return a short-lived signed token containing the Google profile.
        # The frontend will ask for a role then call POST /auth/google/register.
        signup_token = create_signup_token(
            {
                "email": email,
                "full_name": full_name,
                "avatar_url": avatar_url,
                "google_id": google_id,
            }
        )
        return {
            "action": "signup",
            "signup_token": signup_token,
            "user_info": {
                "email": email,
                "full_name": full_name,
                "avatar_url": avatar_url,
            },
        }

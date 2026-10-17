from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, Response, status
from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.modules.auth.models import OAuthAccount, User
from app.modules.auth.service import start_session
from app.shared.normalize import normalize_email

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
) -> None:
    """Sign the Google user in (creating them on first visit); sets the cookie."""
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

    # Linking by email is only safe when Google vouches for inbox ownership.
    if user_info.get("email_verified") is not True:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account email is not verified",
        )

    google_id: str = user_info["sub"]
    email: str = user_info["email"].strip().lower()
    full_name: str = user_info.get("name", "")
    avatar_url: str | None = user_info.get("picture")

    # 2. Check if a user with this email already exists
    user_result = await db.execute(
        select(User).where(func.lower(User.email) == normalize_email(email))
    )
    user = user_result.scalar_one_or_none()

    if user and user.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account has been deleted"
        )

    if user is None:
        # First Google sign-in creates the person; Google vouched for the email.
        user = User(
            full_name=full_name,
            email=email,
            avatar_url=avatar_url,
            is_email_verified=True,
            is_onboarded=True,
        )
        db.add(user)
        await db.flush()

    linked = await db.scalar(
        select(OAuthAccount).where(
            OAuthAccount.provider == "google",
            OAuthAccount.provider_account_id == google_id,
        )
    )
    if linked is None:
        db.add(
            OAuthAccount(
                user_id=user.id, provider="google", provider_account_id=google_id
            )
        )
    await start_session(db, user, response)

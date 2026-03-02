import httpx
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status, Response
from app.core.config import settings
from app.core.security import create_tokens
from app.modules.auth.models import User, OAuthAccount, RefreshToken
from app.modules.auth.enums import UserRole
from urllib.parse import urlencode

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


def get_google_auth_url(state: str) -> str:
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
    }

    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"


async def exchange_google_code(code: str) -> dict:
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
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"}
        )
        resp.raise_for_status()
        return resp.json()


async def google_oauth_callback(
    db: AsyncSession, code: str, response: Response
) -> dict:
    try:
        token_data = await exchange_google_code(code)
        user_info = await get_google_user_info(token_data["access_token"])
    except httpx.HTTPError as e:
        logger.error(f"Google OAuth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to authenticate with Google",
        )

    google_id = user_info["sub"]
    email = user_info["email"]
    full_name = user_info.get("name", "")
    avatar_url = user_info.get("picture")

    # check if oauth account already linked
    result = await db.execute(
        select(OAuthAccount).where(
            OAuthAccount.provider == "google",
            OAuthAccount.provider_account_id == google_id,
        )
    )
    oauth_account = result.scalar_one_or_none()

    if oauth_account:
        # existing oauth user — just log them in
        user_result = await db.execute(
            select(User).where(User.id == oauth_account.user_id)
        )
        user = user_result.scalar_one()
    else:
        # check if email already exists as a password account
        user_result = await db.execute(select(User).where(User.email == email))
        user = user_result.scalar_one_or_none()

        if user:
            # link google to existing account
            db.add(
                OAuthAccount(
                    user_id=user.id,
                    provider="google",
                    provider_account_id=google_id,
                )
            )
        else:
            # brand new user via Google
            # role defaults to candidate — they can change after onboarding
            user = User(
                full_name=full_name,
                email=email,
                avatar_url=avatar_url,
                is_email_verified=True,  # Google emails are verified
                primary_role=UserRole.candidate,
            )
            db.add(user)
            await db.flush()
            db.add(
                OAuthAccount(
                    user_id=user.id,
                    provider="google",
                    provider_account_id=google_id,
                )
            )

    await db.flush()

    tokens, jti, refresh_expires_at = create_tokens(str(user.id))

    # Set the cookie
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=settings.environment == "prod",
        samesite="lax",
        expires=refresh_expires_at,
    )

    db.add(RefreshToken(user_id=user.id, jti=jti, expires_at=refresh_expires_at))
    await db.flush()

    tokens.pop("refresh_token")
    return {"tokens": tokens, "user": user}

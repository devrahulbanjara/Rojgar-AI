from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_db
from app.core.config import settings
from app.core.limiter import limiter
from app.models import UserRole
from app.schemas import CreateUserRequest, LoginRequest, SignupRequest, TokenResponse
from app.schemas.organization import (
    OrganizationLoginRequest,
    OrganizationSignupRequest,
    OrganizationTokenResponse,
)
from app.services import AuthService
from app.services.auth.organization_auth_service import OrganizationAuthService

router = APIRouter()


@router.post("/signup", response_model=TokenResponse)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def signup(
    request: Request,
    signup_data: SignupRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    existing_user = await AuthService.get_user_by_email(signup_data.email, db)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    existing_org = await OrganizationAuthService.get_organization_by_email(
        signup_data.email, db
    )
    if existing_org:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization already registered"
        )
    create_user_data = CreateUserRequest(
        email=signup_data.email,
        name=signup_data.name,
        password=signup_data.password,
        picture=signup_data.picture,
        role=UserRole.CANDIDATE,
    )
    new_user = await AuthService.create_user(create_user_data, db)
    token, max_age = AuthService.create_access_token(new_user.id)
    response.set_cookie(
        key="auth_token",
        value=token,
        max_age=max_age,
        httponly=True,
        secure=settings.SECURE,
        samesite="lax",
    )
    return TokenResponse(access_token=token, token_type="bearer", user=new_user)


@router.post("/login", response_model=TokenResponse)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def login(
    request: Request,
    login_data: LoginRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user = await AuthService.get_user_by_email(login_data.email, db)
    if not user or not user.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    if not AuthService.verify_user_password(user, login_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    token, max_age = AuthService.create_access_token(user.id, login_data.remember_me)
    response.set_cookie(
        key="auth_token",
        value=token,
        max_age=max_age,
        httponly=True,
        secure=settings.SECURE,
        samesite="lax",
    )
    return TokenResponse(access_token=token, token_type="bearer", user=user)


@router.get("/google")
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def google_login(request: Request):
    auth_url = AuthService.generate_google_auth_url()
    return {"auth_url": auth_url}


@router.get("/google/callback")
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def google_callback(
    request: Request, db: Annotated[AsyncSession, Depends(get_db)], code: str
):
    try:
        google_user = await AuthService.exchange_google_code(code)
        user = await AuthService.get_or_create_google_user(google_user, db)
        token, max_age = AuthService.create_access_token(user.id, remember_me=True)
        redirect_url = AuthService.get_redirect_url_for_user(user)
        response = RedirectResponse(url=redirect_url)
        response.set_cookie(
            key="auth_token",
            value=token,
            max_age=max_age,
            httponly=True,
            secure=settings.SECURE,
            samesite="lax",
        )
        return response
    except ValueError:
        error_url = f"{settings.FRONTEND_URL}/login?error=auth_failed"
        return RedirectResponse(url=error_url)
    except Exception:
        error_url = f"{settings.FRONTEND_URL}/login?error=auth_failed"
        return RedirectResponse(url=error_url)


@router.post("/logout")
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def logout(request: Request, response: Response):
    response.delete_cookie(key="auth_token")
    return {"message": "Logged out successfully"}


@router.post("/organization/signup", response_model=OrganizationTokenResponse)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def organization_signup(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    org_data: OrganizationSignupRequest,
    response: Response,
):
    try:
        new_org = await OrganizationAuthService.create_organization(org_data, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    token, max_age = OrganizationAuthService.create_organization_token(
        new_org.organization_id
    )
    response.set_cookie(
        key="auth_token",
        value=token,
        max_age=max_age,
        httponly=True,
        secure=settings.SECURE,
        samesite="lax",
    )
    return OrganizationTokenResponse(
        access_token=token, token_type="bearer", organization=new_org
    )


@router.post("/organization/login", response_model=OrganizationTokenResponse)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def organization_login(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    login_data: OrganizationLoginRequest,
    response: Response,
):
    organization = await OrganizationAuthService.get_organization_by_email(
        login_data.email, db
    )
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    if not OrganizationAuthService.verify_organization_password(
        organization, login_data.password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    token, max_age = OrganizationAuthService.create_organization_token(
        organization.organization_id, login_data.remember_me
    )
    response.set_cookie(
        key="auth_token",
        value=token,
        max_age=max_age,
        httponly=True,
        secure=settings.SECURE,
        samesite="lax",
    )
    return OrganizationTokenResponse(
        access_token=token, token_type="bearer", organization=organization
    )

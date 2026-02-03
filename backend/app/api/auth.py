from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse

from app.api.dependencies import get_auth_service, get_organization_auth_service
from app.core.config import settings
from app.core.limiter import limiter
from app.db.models.user import UserRole
from app.schemas import CreateUserRequest, LoginRequest, SignupRequest, TokenResponse
from app.schemas.organization import (
    OrganizationLoginRequest,
    OrganizationSignupRequest,
    OrganizationTokenResponse,
)
from app.services.auth.auth_service import AuthService
from app.services.auth.organization_auth_service import OrganizationAuthService

router = APIRouter()


@router.post("/signup", response_model=TokenResponse)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def signup(
    request: Request,
    signup_data: SignupRequest,
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    organization_auth_service: Annotated[
        OrganizationAuthService, Depends(get_organization_auth_service)
    ],
):
    existing_user = await auth_service.get_user_by_email(signup_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )
    existing_org = await organization_auth_service.get_organization_by_email(
        signup_data.email
    )
    if existing_org:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization already registered",
        )
    create_user_data = CreateUserRequest(
        email=signup_data.email,
        name=signup_data.name,
        password=signup_data.password,
        picture=signup_data.picture,
        role=UserRole.CANDIDATE,
    )
    new_user = await auth_service.create_user(create_user_data)
    token, max_age = auth_service.create_access_token(new_user.user_id)
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
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
):
    user = await auth_service.get_user_by_email(login_data.email)
    if not user or not user.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )
    if not auth_service.verify_user_password(user, login_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )
    token, max_age = auth_service.create_access_token(
        user.user_id, login_data.remember_me
    )
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
async def google_login(
    request: Request,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
):
    auth_url = auth_service.generate_google_auth_url()
    return {"auth_url": auth_url}


@router.get("/google/callback")
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def google_callback(
    request: Request,
    code: str,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
):
    try:
        google_user = await auth_service.exchange_google_code(code)
        user = await auth_service.get_or_create_google_user(google_user)
        token, max_age = auth_service.create_access_token(
            user.user_id, remember_me=True
        )
        redirect_url = auth_service.get_redirect_url_for_user(user)
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
    org_data: OrganizationSignupRequest,
    response: Response,
    organization_auth_service: Annotated[
        OrganizationAuthService, Depends(get_organization_auth_service)
    ],
):
    try:
        new_org = await organization_auth_service.create_organization(org_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    token, max_age = organization_auth_service.create_organization_token(
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
    login_data: OrganizationLoginRequest,
    response: Response,
    organization_auth_service: Annotated[
        OrganizationAuthService, Depends(get_organization_auth_service)
    ],
):
    organization = await organization_auth_service.get_organization_by_email(
        login_data.email
    )
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )
    if not organization_auth_service.verify_organization_password(
        organization, login_data.password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )
    token, max_age = organization_auth_service.create_organization_token(
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

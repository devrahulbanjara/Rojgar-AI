from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core import get_current_user_id, get_db, settings
from app.core.limiter import limiter
from app.schemas import (
    CreateUserRequest,
    LoginRequest,
    RoleSelectionRequest,
    SignupRequest,
    TokenResponse,
)
from app.services import AuthService

router = APIRouter()


@router.post("/signup", response_model=TokenResponse)
@limiter.limit("5/minute")
def signup(
    request: Request,
    signup_data: SignupRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    existing_user = AuthService.get_user_by_email(signup_data.email, db)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    create_user_data = CreateUserRequest(
        email=signup_data.email,
        name=signup_data.name,
        password=signup_data.password,
        picture=signup_data.picture,
        role=signup_data.role,
    )

    new_user = AuthService.create_user(create_user_data, db)

    token, max_age = AuthService.create_access_token(new_user.id)

    response.set_cookie(
        key="auth_token",
        value=token,
        max_age=max_age,
        httponly=True,
        secure=settings.SECURE,
        samesite="lax",
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=AuthService.create_user_response(new_user),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(
    request: Request,
    login_data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    user = AuthService.get_user_by_email(login_data.email, db)

    if not user or not user.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not AuthService.verify_user_password(user, login_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
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

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=AuthService.create_user_response(user),
    )


@router.get("/google")
@limiter.limit("5/minute")
def google_login(request: Request):
    auth_url = AuthService.generate_google_auth_url()
    return {"auth_url": auth_url}


@router.get("/google/callback")
@limiter.limit("5/minute")
async def google_callback(
    request: Request, code: str, db: Session = Depends(get_db)
):
    try:
        google_user = await AuthService.exchange_google_code(code)

        user = AuthService.get_or_create_google_user(google_user, db)

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

    except Exception:
        error_url = f"{settings.FRONTEND_URL}/login?error=auth_failed"
        return RedirectResponse(url=error_url)


@router.post("/select-role")
@limiter.limit("5/minute")
def select_role(
    request: Request,
    role_data: RoleSelectionRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    from app.services import UserService

    user = UserService.get_user_by_id(user_id, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user = AuthService.assign_role_and_create_profile(user, role_data.role, db)

    return {
        "user": AuthService.create_user_response(user),
        "redirect_url": f"/dashboard/{role_data.role.value}",
    }


@router.post("/logout")
@limiter.limit("5/minute")
def logout(request: Request, response: Response):
    response.delete_cookie(key="auth_token")
    return {"message": "Logged out successfully"}

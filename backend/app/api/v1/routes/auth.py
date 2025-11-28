from fastapi import APIRouter, HTTPException, status, Response, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core import settings, get_db, get_current_user_id
from app.schemas import (
    SignupRequest,
    LoginRequest,
    RoleSelectionRequest,
    TokenResponse,
    CreateUserRequest,
)
from app.services import AuthService

router = APIRouter()


@router.post("/signup", response_model=TokenResponse)
def signup(
    signup_data: SignupRequest, response: Response, db: Session = Depends(get_db)
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
def login(login_data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = AuthService.get_user_by_email(login_data.email, db)

    if not user or not user.password_hash:
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
        secure=False,
        samesite="lax",
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=AuthService.create_user_response(user),
    )


@router.get("/google")
def google_login():
    auth_url = AuthService.generate_google_auth_url()
    return {"auth_url": auth_url}


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    try:
        google_user = await AuthService.exchange_google_code(code)

        user = AuthService.get_or_create_google_user(google_user, db)

        token, max_age = AuthService.create_access_token(user.id)

        redirect_url = AuthService.get_redirect_url_for_user(user)

        response = RedirectResponse(url=redirect_url)
        response.set_cookie(
            key="auth_token",
            value=token,
            max_age=max_age,
            httponly=True,
            secure=False,
            samesite="lax",
        )
        return response

    except Exception as e:
        error_url = f"{settings.FRONTEND_URL}/login?error=auth_failed"
        return RedirectResponse(url=error_url)


@router.post("/select-role")
def select_role(
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

    if user.role is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role already selected",
        )

    user = AuthService.update_user_role(user, role_data.role, db)

    return {
        "user": AuthService.create_user_response(user),
        "redirect_url": f"/dashboard/{role_data.role.value}",
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="auth_token")
    return {"message": "Logged out successfully"}

"""
Authentication routes - Login, signup, Google OAuth
Simple and easy to understand
"""

from fastapi import APIRouter, HTTPException, status, Response, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.user import (
    SignupRequest,
    LoginRequest,
    RoleSelectionRequest,
    TokenResponse,
)
from app.services.auth_service import AuthService

router = APIRouter()


# ============= Email/Password Auth =============

@router.post("/signup", response_model=TokenResponse)
def signup(signup_data: SignupRequest, response: Response, db: Session = Depends(get_db)):
    """
    Create a new account with email and password
    """
    # Check if user already exists
    existing_user = AuthService.get_user_by_email(signup_data.email, db)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create new user
    new_user = AuthService.create_user(
        email=signup_data.email,
        name=signup_data.name,
        password=signup_data.password,
        picture=signup_data.picture,
        role=signup_data.role,
        db=db
    )
    
    # Create token
    token, max_age = AuthService.create_access_token(new_user.id)
    
    # Set cookie
    response.set_cookie(
        key="auth_token",
        value=token,
        max_age=max_age,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
    )
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=AuthService.create_user_response(new_user),
    )


@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Login with email and password
    """
    # Find user by email
    user = AuthService.get_user_by_email(login_data.email, db)
    
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    # Verify password
    if not AuthService.verify_user_password(user, login_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    # Create token
    token, max_age = AuthService.create_access_token(user.id, login_data.remember_me)
    
    # Set cookie
    response.set_cookie(
        key="auth_token",
        value=token,
        max_age=max_age,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
    )
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=AuthService.create_user_response(user),
    )


# ============= Google OAuth =============

@router.get("/google")
def google_login():
    """
    Start Google OAuth flow
    Returns URL to redirect user to Google login
    """
    auth_url = AuthService.generate_google_auth_url()
    return {"auth_url": auth_url}


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """
    Handle callback from Google OAuth
    This is called after user authorizes on Google
    """
    try:
        # Exchange code for user info
        google_user = await AuthService.exchange_google_code(code)
        
        # Get or create user
        user = AuthService.get_or_create_google_user(google_user, db)
        
        # Create token
        token, max_age = AuthService.create_access_token(user.id)
        
        # Redirect to appropriate page
        redirect_url = AuthService.get_redirect_url_for_user(user)
        
        # Create response with cookie
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
        # Redirect to login with error
        error_url = f"{settings.FRONTEND_URL}/login?error=auth_failed"
        return RedirectResponse(url=error_url)


# ============= Role Selection (for Google OAuth users) =============

@router.post("/select-role")
def select_role(
    role_data: RoleSelectionRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Select role after Google login
    Google users don't have a role initially, so they choose one after first login
    """
    # Find user
    from app.services.user_service import UserService
    user = UserService.get_user_by_id(user_id, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Check if role already set
    if user.role is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role already selected",
        )
    
    # Update role
    user = AuthService.update_user_role(user, role_data.role, db)
    
    return {
        "user": AuthService.create_user_response(user),
        "redirect_url": f"/dashboard/{role_data.role.value}"
    }


# ============= Logout =============

@router.post("/logout")
def logout(response: Response):
    """
    Logout - just clear the cookie
    """
    response.delete_cookie(key="auth_token")
    return {"message": "Logged out successfully"}

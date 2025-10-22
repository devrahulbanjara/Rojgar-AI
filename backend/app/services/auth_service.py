import uuid
import httpx
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_token
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, GoogleUserInfo, CreateUserRequest


class AuthService:
    """Service for handling authentication logic"""
    
    @staticmethod
    def create_user_response(user: User) -> UserResponse:
        return UserResponse.model_validate(user)
    
    @staticmethod
    def get_user_by_email(email: str, db: Session) -> Optional[User]:
        return db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    
    @staticmethod
    def get_user_by_google_id(google_id: str, db: Session) -> Optional[User]:
        return db.execute(select(User).where(User.google_id == google_id)).scalar_one_or_none()
    
    @staticmethod
    def create_user(user_data: CreateUserRequest, db: Session) -> User:
        new_user = User(
            id=str(uuid.uuid4()),
            email=user_data.email,
            name=user_data.name,
            picture=user_data.picture,
            google_id=user_data.google_id,
            role=user_data.role.value if user_data.role else None,
        )

        if user_data.password:
            new_user.password_hash = hash_password(user_data.password)

        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    
    @staticmethod
    def verify_user_password(user: User, password: str) -> bool:
        """Verify user password"""
        if not user.password_hash:
            return False
        return verify_password(password, user.password_hash)
    
    @staticmethod
    def create_access_token(user_id: str, remember_me: bool = False) -> tuple[str, int]:
        """
        Create access token for user
        Returns: (token, max_age_seconds)
        """
        if remember_me:
            token = create_token(user_id, expires_minutes=30 * 24 * 60)  # 30 days
            max_age = 30 * 24 * 60 * 60
        else:
            token = create_token(user_id)
            max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        
        return token, max_age
    
    @staticmethod
    def generate_google_auth_url() -> str:
        """Generate Google OAuth URL"""
        from urllib.parse import urlencode
        
        google_auth_url = "https://accounts.google.com/o/oauth2/auth"
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": f"{settings.BACKEND_URL}/auth/google/callback",
            "scope": "openid email profile",
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent",
        }
        
        return f"{google_auth_url}?{urlencode(params)}"
    
    @staticmethod
    async def exchange_google_code(code: str) -> GoogleUserInfo:
        """
        Exchange Google authorization code for user info
        Raises HTTPException on failure
        """
        from fastapi import HTTPException, status
        
        async with httpx.AsyncClient() as client:
            # Exchange code for tokens
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
                    detail="Failed to get Google token",
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
            
            return GoogleUserInfo(**user_response.json())
    
    @staticmethod
    def get_or_create_google_user(google_user: GoogleUserInfo, db: Session) -> User:
        """Get existing Google user or create new one"""
        user = AuthService.get_user_by_google_id(google_user.id, db)
        
        if not user:
            create_user_data = CreateUserRequest(
                email=google_user.email,
                name=google_user.name,
                google_id=google_user.id,
                picture=google_user.picture
            )
            user = AuthService.create_user(create_user_data, db)
        
        return user
    
    @staticmethod
    def update_user_role(user: User, role: UserRole, db: Session) -> User:
        """Update user role"""
        user.role = role.value
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def get_redirect_url_for_user(user: User) -> str:
        """Get appropriate redirect URL based on user role"""
        if user.role:
            return f"{settings.FRONTEND_URL}/dashboard/{user.role}"
        else:
            return f"{settings.FRONTEND_URL}/select-role"

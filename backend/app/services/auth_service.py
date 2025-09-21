"""
Authentication service for handling Google OAuth and email/password auth
"""

import httpx
import hashlib
from typing import Optional
from datetime import timedelta
from fastapi import HTTPException, status
from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.user import (
    GoogleUserInfo,
    UserCreate,
    TokenResponse,
    UserResponse,
    LoginRequest,
    SignupRequest,
    UserRole,
)
from app.repositories.user_repo import user_repo
from app.utils.common import generate_user_id


class AuthService:
    """Service for authentication operations"""

    async def verify_google_token(self, token: str) -> GoogleUserInfo:
        """Verify Google OAuth token and get user info"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://www.googleapis.com/oauth2/v1/userinfo?access_token={token}"
                )

                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid Google token",
                    )

                return GoogleUserInfo(**response.json())
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to verify Google token",
            )

    def authenticate_with_google(self, google_user: GoogleUserInfo) -> TokenResponse:
        """Authenticate user with Google OAuth"""
        # Check if user exists
        existing_user = user_repo.get_by_google_id(google_user.id)

        if existing_user:
            user = existing_user
        else:
            # Create new user
            user = User(
                id=generate_user_id(),
                google_id=google_user.id,
                email=google_user.email,
                name=google_user.name,
                picture=google_user.picture,
            )
            user = user_repo.create(user)

        # Create JWT token
        access_token = create_access_token(
            data={"sub": user.id},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user.id,
                email=user.email,
                name=user.name,
                picture=user.picture,
                google_id=user.google_id,
                role=user.role,
                is_active=user.is_active,
                created_at=user.created_at,
                updated_at=user.updated_at,
            ),
        )

    def _hash_password(self, password: str) -> str:
        """Hash password using SHA-256 (simple implementation)"""
        return hashlib.sha256(f"{password}{settings.SECRET_KEY}".encode()).hexdigest()

    def _verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash"""
        return self._hash_password(password) == hashed

    def signup_with_email(self, signup_data: SignupRequest) -> TokenResponse:
        """Sign up user with email and password"""
        # Check if user already exists
        existing_user = user_repo.get_by_email(signup_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists",
            )

        # Create new user
        user = User(
            id=generate_user_id(),
            email=signup_data.email,
            name=signup_data.name,
            picture=signup_data.picture,
            password_hash=self._hash_password(signup_data.password),
            role=signup_data.role,
        )
        user = user_repo.create(user)

        # Create JWT token
        access_token = create_access_token(
            data={"sub": user.id},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user.id,
                email=user.email,
                name=user.name,
                picture=user.picture,
                role=user.role,
                is_active=user.is_active,
                created_at=user.created_at,
                updated_at=user.updated_at,
            ),
        )

    def login_with_email(self, login_data: LoginRequest) -> TokenResponse:
        """Login user with email and password"""
        user = user_repo.get_by_email(login_data.email)

        if not user or not user.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not self._verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        # Create JWT token
        access_token = create_access_token(
            data={"sub": user.id},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user.id,
                email=user.email,
                name=user.name,
                picture=user.picture,
                role=user.role,
                is_active=user.is_active,
                created_at=user.created_at,
                updated_at=user.updated_at,
            ),
        )

    def select_role(self, user_id: str, role: UserRole) -> UserResponse:
        """Select role for a user"""
        user = user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        if user.role is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User role already selected",
            )

        updated_user = user_repo.update(user_id, role=role)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user role",
            )

        return UserResponse(
            id=updated_user.id,
            email=updated_user.email,
            name=updated_user.name,
            picture=updated_user.picture,
            google_id=updated_user.google_id,
            role=updated_user.role,
            is_active=updated_user.is_active,
            created_at=updated_user.created_at,
            updated_at=updated_user.updated_at,
        )


# Global service instance
auth_service = AuthService()

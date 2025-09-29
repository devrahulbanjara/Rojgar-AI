"""
User service for user-related operations
"""

from typing import Optional
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserResponse
from app.repositories.user_repo import user_repo


class UserService:
    """Service for user operations"""

    def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        """Get user by ID"""
        user = user_repo.get_by_id(user_id)
        if not user:
            return None

        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            picture=user.picture,
            google_id=user.google_id,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    def get_current_user(self, user_id: str) -> UserResponse:
        """Get current authenticated user"""
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        return user


# Global service instance
user_service = UserService()

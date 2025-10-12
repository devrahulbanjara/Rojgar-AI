"""
User service for user-related operations
"""

from typing import Optional
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserRead
from app.repositories.user_repo import user_repo


class UserService:
    """Service for user operations"""

    def get_user_by_id(self, user_id: str) -> Optional[UserRead]:
        """Get user by ID"""
        user = user_repo.get_by_id(user_id)
        if not user:
            return None

        return UserRead.model_validate(user)

    def get_current_user(self, user_id: str) -> UserRead:
        """Get current authenticated user"""
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        return user


# Global service instance
user_service = UserService()

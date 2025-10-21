"""
User service - Business logic for user operations
"""

from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.user import User
from app.schemas.user import UserResponse


class UserService:
    """Service for handling user-related business logic"""
    
    @staticmethod
    def get_user_by_id(user_id: str, db: Session) -> Optional[User]:
        """Get user by ID"""
        return db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    
    @staticmethod
    def to_user_response(user: User) -> UserResponse:
        """Convert User model to UserResponse"""
        return UserResponse.model_validate(user)

"""
User service - Business logic for user operations
"""

from typing import Optional
from sqlmodel import Session

from app.models.user import User, UserResponse


class UserService:
    """Service for handling user-related business logic"""
    
    @staticmethod
    def get_user_by_id(user_id: str, db: Session) -> Optional[User]:
        """Get user by ID"""
        return db.get(User, user_id)
    
    @staticmethod
    def to_user_response(user: User) -> UserResponse:
        """Convert User model to UserResponse"""
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


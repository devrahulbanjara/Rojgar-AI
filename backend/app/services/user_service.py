from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.user import User
from app.schemas import UserResponse

class UserService:
    
    @staticmethod
    def get_user_by_id(user_id: str, db: Session) -> Optional[User]:
        return db.execute(select(User).where(User.user_id == user_id)).scalar_one_or_none()
    
    @staticmethod
    def to_user_response(user: User) -> UserResponse:
        return UserResponse.model_validate(user)

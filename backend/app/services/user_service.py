from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User
from app.schemas import UserResponse


class UserService:
    @staticmethod
    def get_user_by_id(user_id: str, db: Session) -> User | None:
        return db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()

    @staticmethod
    def to_user_response(user: User) -> UserResponse:
        return UserResponse.model_validate(user)

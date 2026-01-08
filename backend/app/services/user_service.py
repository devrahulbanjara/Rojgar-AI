from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User
from app.schemas import UserResponse


class UserService:
    @staticmethod
    def get_user_by_id(user_id: str, db: Session) -> User | None:
        return db.execute(
            select(User).where(User.user_id == user_id)
        ).scalar_one_or_none()

    @staticmethod
    def to_user_response(user: User) -> UserResponse:
        return UserResponse(
            id=user.user_id,
            email=user.email,
            name=user.name,
            picture=user.picture,
            google_id=user.google_id,
            role=user.role,
            organization_id=user.organization_id,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

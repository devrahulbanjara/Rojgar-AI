import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import User


class UserService:
    @staticmethod
    def get_user_by_id(user_id: uuid.UUID, db: Session) -> User | None:
        return db.execute(
            select(User)
            .where(User.user_id == user_id)
            .options(selectinload(User.organization))
        ).scalar_one_or_none()

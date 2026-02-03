import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import User


class UserService:
    @staticmethod
    async def get_user_by_id(user_id: uuid.UUID, db: AsyncSession) -> User | None:
        result = await db.execute(
            select(User)
            .where(User.user_id == user_id)
            .options(selectinload(User.organization))
        )
        return result.scalar_one_or_none()

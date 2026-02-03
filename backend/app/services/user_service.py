import uuid

from app.db.models.user import User
from app.db.repositories.user_repo import UserRepository


class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        """Get user by ID with organization"""
        return await self.user_repo.get_with_organization(user_id)

    async def update_profile(self, user_id: uuid.UUID, name: str) -> User | None:
        """Update user profile"""
        return await self.user_repo.update(user_id, name=name)

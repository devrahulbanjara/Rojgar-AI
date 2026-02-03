import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.organization import Organization
from app.db.models.user import User, UserGoogle
from app.db.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get(self, id: uuid.UUID) -> User | None:
        """Get user by ID with related data"""
        query = (
            select(User)
            .where(User.user_id == id)
            .options(selectinload(User.google_account), selectinload(User.organization))
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        """Get user by email with related data"""
        query = (
            select(User)
            .where(User.email == email)
            .options(selectinload(User.google_account), selectinload(User.organization))
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_with_organization(self, user_id: uuid.UUID) -> User | None:
        """Get user with organization details"""
        query = (
            select(User)
            .options(selectinload(User.organization))
            .where(User.user_id == user_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_with_google_account(self, user_id: uuid.UUID) -> User | None:
        """Get user with Google account details"""
        query = (
            select(User)
            .options(selectinload(User.google_account))
            .where(User.user_id == user_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_organization(self, organization_id: uuid.UUID) -> Sequence[User]:
        """Get all users in an organization"""
        query = (
            select(User)
            .where(User.organization_id == organization_id)
            .order_by(User.created_at.desc())
        )
        result = await self.db.execute(query)
        return result.scalars().all()


class UserGoogleRepository(BaseRepository[UserGoogle]):
    def __init__(self, db: AsyncSession):
        super().__init__(UserGoogle, db)

    async def get_by_google_id(self, google_id: str) -> UserGoogle | None:
        """Get user Google account by Google ID"""
        query = select(UserGoogle).where(UserGoogle.user_google_id == google_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_with_user(self, google_id: str) -> UserGoogle | None:
        """Get user Google account with user details"""
        query = (
            select(UserGoogle)
            .options(selectinload(UserGoogle.user))
            .where(UserGoogle.user_google_id == google_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()


class OrganizationRepository(BaseRepository[Organization]):
    def __init__(self, db: AsyncSession):
        super().__init__(Organization, db)

    async def get_by_name(self, name: str) -> Organization | None:
        """Get organization by name"""
        query = select(Organization).where(Organization.name == name)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Organization | None:
        """Get organization by email"""
        query = select(Organization).where(Organization.email == email)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_with_recruiters(
        self, organization_id: uuid.UUID
    ) -> Organization | None:
        """Get organization with recruiters"""
        query = (
            select(Organization)
            .options(selectinload(Organization.recruiters))
            .where(Organization.organization_id == organization_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_datetime
from app.core.security import hash_password
from app.models import User, UserRole
from app.schemas.organization import UpdateRecruiterRequest
from app.services.auth.auth_service import AuthService
from app.services.auth.organization_auth_service import OrganizationAuthService


class RecruiterCRUD:
    @staticmethod
    async def create_recruiter(
        organization_id: uuid.UUID,
        email: str,
        name: str,
        password: str,
        db: AsyncSession,
    ) -> User:
        existing_user = await AuthService.get_user_by_email(email, db)
        if existing_user:
            raise ValueError("Email already registered to ConvexHire previously.")
        existing_in_org = await OrganizationAuthService.get_organization_by_email(
            email, db
        )
        if existing_in_org:
            raise ValueError(
                "Recruiter email already registered to ConvexHire previously."
            )
        now = get_datetime()
        new_recruiter = User(
            user_id=uuid.uuid4(),
            organization_id=organization_id,
            email=email,
            name=name,
            role=UserRole.RECRUITER.value,
            password=hash_password(password),
            created_at=now,
            updated_at=now,
        )
        db.add(new_recruiter)
        await db.commit()
        await db.refresh(new_recruiter)
        return new_recruiter

    @staticmethod
    async def get_recruiter_by_id(
        recruiter_id: uuid.UUID, db: AsyncSession
    ) -> User | None:
        result = await db.execute(select(User).where(User.user_id == recruiter_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_recruiters_by_organization(
        organization_id: uuid.UUID, db: AsyncSession
    ) -> list[User]:
        result = await db.execute(
            select(User).where(User.organization_id == organization_id)
        )
        return list(result.scalars().all())

    @staticmethod
    async def update_recruiter(
        recruiter_id: uuid.UUID, update_data: UpdateRecruiterRequest, db: AsyncSession
    ) -> User:
        recruiter = await RecruiterCRUD.get_recruiter_by_id(recruiter_id, db)
        if not recruiter:
            return None
        if update_data.name is not None:
            recruiter.name = update_data.name
        if update_data.email is not None:
            existing_user = await db.execute(
                select(User).where(
                    User.email == update_data.email, User.user_id != recruiter_id
                )
            ).scalar_one_or_none()
            if existing_user:
                raise ValueError("Email already in use")
            recruiter.email = update_data.email
        recruiter.updated_at = get_datetime()
        db.add(recruiter)
        await db.commit()
        await db.refresh(recruiter)
        return recruiter

    @staticmethod
    async def delete_recruiter(recruiter_id: uuid.UUID, db: AsyncSession):
        recruiter = await RecruiterCRUD.get_recruiter_by_id(recruiter_id, db)
        if recruiter:
            db.delete(recruiter)
            await db.commit()
        return recruiter

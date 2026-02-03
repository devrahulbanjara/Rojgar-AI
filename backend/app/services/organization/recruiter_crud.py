import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import BusinessLogicError, NotFoundError, get_datetime
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
            raise BusinessLogicError(
                message="Email already registered to ConvexHire previously.",
                details={
                    "email": email,
                    "existing_user_id": str(existing_user.user_id),
                    "existing_user_role": existing_user.role,
                    "organization_id": str(organization_id),
                },
            )
        existing_in_org = await OrganizationAuthService.get_organization_by_email(
            email, db
        )
        if existing_in_org:
            raise BusinessLogicError(
                message="Recruiter email already registered to ConvexHire previously.",
                details={
                    "email": email,
                    "existing_organization_id": str(existing_in_org.organization_id),
                    "organization_id": str(organization_id),
                },
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
            raise NotFoundError(
                message="Recruiter not found",
                details={
                    "recruiter_id": str(recruiter_id),
                },
            )
        if update_data.name is not None:
            recruiter.name = update_data.name
        if update_data.email is not None:
            existing_user = await db.execute(
                select(User).where(
                    User.email == update_data.email, User.user_id != recruiter_id
                )
            ).scalar_one_or_none()
            if existing_user:
                raise BusinessLogicError(
                    message="Email already in use",
                    details={
                        "email": update_data.email,
                        "existing_user_id": str(existing_user.user_id),
                        "recruiter_id": str(recruiter_id),
                    },
                )
            recruiter.email = update_data.email
        recruiter.updated_at = get_datetime()
        db.add(recruiter)
        await db.commit()
        await db.refresh(recruiter)
        return recruiter

    @staticmethod
    async def delete_recruiter(recruiter_id: uuid.UUID, db: AsyncSession) -> None:
        recruiter = await RecruiterCRUD.get_recruiter_by_id(recruiter_id, db)
        if not recruiter:
            raise NotFoundError(
                message="Recruiter not found",
                details={
                    "recruiter_id": str(recruiter_id),
                },
            )
        db.delete(recruiter)
        await db.commit()

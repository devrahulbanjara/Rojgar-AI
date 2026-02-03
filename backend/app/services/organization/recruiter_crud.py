import uuid

from app.core import get_datetime
from app.core.security import hash_password
from app.db.models.user import User, UserRole
from app.db.repositories.user_repo import OrganizationRepository, UserRepository
from app.schemas.organization import UpdateRecruiterRequest


class RecruiterCrudService:
    def __init__(
        self,
        user_repo: UserRepository,
        organization_repo: OrganizationRepository,
        auth_service,
        organization_auth_service,
    ):
        self.user_repo = user_repo
        self.organization_repo = organization_repo
        self.auth_service = auth_service
        self.organization_auth_service = organization_auth_service

    async def create_recruiter(
        self,
        organization_id: uuid.UUID,
        email: str,
        name: str,
        password: str,
    ) -> User:
        """Create a new recruiter"""
        # Check if email already exists as user
        existing_user = await self.auth_service.get_user_by_email(email)
        if existing_user:
            raise ValueError("Email already registered to ConvexHire previously.")

        # Check if email exists as organization
        existing_org = await self.organization_auth_service.get_organization_by_email(
            email
        )
        if existing_org:
            raise ValueError(
                "Recruiter email already registered to ConvexHire previously."
            )

        new_recruiter = User(
            user_id=uuid.uuid4(),
            organization_id=organization_id,
            email=email,
            name=name,
            role=UserRole.RECRUITER.value,
            password=hash_password(password),
            created_at=get_datetime(),
            updated_at=get_datetime(),
        )
        return await self.user_repo.create(new_recruiter)

    async def get_recruiter_by_id(self, recruiter_id: uuid.UUID) -> User | None:
        """Get recruiter by ID"""
        return await self.user_repo.get(recruiter_id)

    async def get_recruiters_by_organization(
        self, organization_id: uuid.UUID
    ) -> list[User]:
        """Get all recruiters for an organization"""
        recruiters = await self.user_repo.get_by_organization(organization_id)
        return list(recruiters)

    async def update_recruiter(
        self, recruiter_id: uuid.UUID, update_data: UpdateRecruiterRequest
    ) -> User | None:
        """Update recruiter"""
        recruiter = await self.get_recruiter_by_id(recruiter_id)
        if not recruiter:
            return None

        update_dict = {}
        if update_data.name is not None:
            update_dict["name"] = update_data.name
        if update_data.email is not None:
            # Check if email is already in use
            existing_user = await self.user_repo.get_by_email(update_data.email)
            if existing_user and existing_user.user_id != recruiter_id:
                raise ValueError("Email already in use")
            update_dict["email"] = update_data.email

        update_dict["updated_at"] = get_datetime()
        return await self.user_repo.update(recruiter_id, **update_dict)

    async def delete_recruiter(self, recruiter_id: uuid.UUID) -> User | None:
        """Delete recruiter"""
        recruiter = await self.get_recruiter_by_id(recruiter_id)
        if recruiter:
            await self.user_repo.delete(recruiter_id)
        return recruiter

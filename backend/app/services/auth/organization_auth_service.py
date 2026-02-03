import uuid

from app.core import get_datetime
from app.core.config import settings
from app.core.security import create_token, hash_password, verify_password
from app.db.models.organization import Organization
from app.db.repositories.user_repo import OrganizationRepository, UserRepository
from app.schemas.organization import OrganizationSignupRequest


class OrganizationAuthService:
    def __init__(
        self,
        user_repo: UserRepository,
        organization_repo: OrganizationRepository,
    ):
        self.user_repo = user_repo
        self.organization_repo = organization_repo

    async def get_organization_by_email(self, email: str) -> Organization | None:
        """Get organization by email"""
        return await self.organization_repo.get_by_email(email)

    async def create_organization(
        self, org_data: OrganizationSignupRequest
    ) -> Organization:
        """Create a new organization"""
        # Check if email already exists
        existing_org = await self.get_organization_by_email(org_data.email)
        if existing_org:
            raise ValueError("Email already registered")

        # Check if user with email exists
        existing_user = await self.user_repo.get_by_email(org_data.email)
        if existing_user:
            raise ValueError("Email already registered")

        # Create organization
        now = get_datetime()
        new_org = Organization(
            organization_id=uuid.uuid4(),
            email=org_data.email,
            password=hash_password(org_data.password),
            name=org_data.name,
            location_city=org_data.location_city,
            location_country=org_data.location_country,
            website=org_data.website,
            description=org_data.description,
            industry=org_data.industry,
            founded_year=org_data.founded_year,
            created_at=now,
            updated_at=now,
        )
        return await self.organization_repo.create(new_org)

    def verify_organization_password(
        self, organization: Organization, password: str
    ) -> bool:
        """Verify organization password"""
        return verify_password(password, organization.password)

    def create_organization_token(
        self, organization_id: uuid.UUID, remember_me: bool = False
    ) -> tuple[str, int]:
        """Create access token for organization"""
        org_id_str = str(organization_id)
        if remember_me:
            token = create_token(
                org_id_str, entity_type="organization", expires_minutes=30 * 24 * 60
            )
            max_age = 30 * 24 * 60 * 60
        else:
            token = create_token(org_id_str, entity_type="organization")
            max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        return (token, max_age)

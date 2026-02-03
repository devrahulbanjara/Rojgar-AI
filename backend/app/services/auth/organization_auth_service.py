import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_datetime
from app.core.config import settings
from app.core.security import create_token, hash_password, verify_password
from app.models import Organization
from app.schemas.organization import OrganizationSignupRequest
from app.services.auth.auth_service import AuthService


class OrganizationAuthService:
    @staticmethod
    async def get_organization_by_email(
        email: str, db: AsyncSession
    ) -> Organization | None:
        result = await db.execute(
            select(Organization).where(Organization.email == email)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create_organization(
        org_data: OrganizationSignupRequest, db: AsyncSession
    ) -> Organization:
        existing_org = await OrganizationAuthService.get_organization_by_email(
            org_data.email, db
        )
        if existing_org:
            raise ValueError("Email already registered")
        existing_user = await AuthService.get_user_by_email(org_data.email, db)
        if existing_user:
            raise ValueError("Email already registered")
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
        db.add(new_org)
        await db.commit()
        await db.refresh(new_org)
        return new_org

    @staticmethod
    def verify_organization_password(organization: Organization, password: str) -> bool:
        return verify_password(password, organization.password)

    @staticmethod
    def create_organization_token(
        organization_id: uuid.UUID, remember_me: bool = False
    ) -> tuple[str, int]:
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

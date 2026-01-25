import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import BusinessLogicError, get_datetime
from app.core.security import create_token, hash_password, verify_password
from app.models import Organization
from app.schemas.organization import OrganizationSignupRequest


class OrganizationAuthService:
    @staticmethod
    def get_organization_by_email(email: str, db: Session) -> Organization | None:
        return db.execute(
            select(Organization).where(Organization.email == email)
        ).scalar_one_or_none()

    @staticmethod
    def create_organization(
        org_data: OrganizationSignupRequest, db: Session
    ) -> Organization:
        existing_org = OrganizationAuthService.get_organization_by_email(
            org_data.email, db
        )
        if existing_org:
            raise BusinessLogicError("Email already registered")

        from app.services.auth.auth_service import AuthService

        existing_user = AuthService.get_user_by_email(org_data.email, db)
        if existing_user:
            raise BusinessLogicError("Email already registered")

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
        db.commit()
        db.refresh(new_org)
        return new_org

    @staticmethod
    def verify_organization_password(organization: Organization, password: str) -> bool:
        return verify_password(password, organization.password)

    @staticmethod
    def create_organization_token(
        organization_id: uuid.UUID, remember_me: bool = False
    ) -> tuple[str, int]:
        from app.core.config import settings

        org_id_str = str(organization_id)

        if remember_me:
            token = create_token(
                org_id_str,
                entity_type="organization",
                expires_minutes=30 * 24 * 60,
            )
            max_age = 30 * 24 * 60 * 60
        else:
            token = create_token(org_id_str, entity_type="organization")
            max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

        return token, max_age

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import get_datetime
from app.core.security import create_token, hash_password, verify_password
from app.models import Organization
from app.schemas.organization import OrganizationResponse, OrganizationSignupRequest


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
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        from app.services.auth.auth_service import AuthService

        existing_user = AuthService.get_user_by_email(org_data.email, db)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        now = get_datetime()
        new_org = Organization(
            organization_id=str(uuid.uuid4()),
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
        organization_id: str, remember_me: bool = False
    ) -> tuple[str, int]:
        from app.core.config import settings

        if remember_me:
            token = create_token(
                organization_id,
                entity_type="organization",
                expires_minutes=30 * 24 * 60,
            )
            max_age = 30 * 24 * 60 * 60
        else:
            token = create_token(organization_id, entity_type="organization")
            max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

        return token, max_age

    @staticmethod
    def create_organization_response(
        organization: Organization,
    ) -> OrganizationResponse:
        return OrganizationResponse(
            id=organization.organization_id,
            email=organization.email,
            name=organization.name,
            location_city=organization.location_city,
            location_country=organization.location_country,
            website=organization.website,
            description=organization.description,
            industry=organization.industry,
            founded_year=organization.founded_year,
            created_at=organization.created_at,
            updated_at=organization.updated_at,
        )

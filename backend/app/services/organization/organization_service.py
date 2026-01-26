import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import NotFoundError, get_datetime
from app.models import Organization
from app.schemas.organization import OrganizationUpdateRequest


class OrganizationService:
    @staticmethod
    def get_organization_by_id(
        organization_id: uuid.UUID, db: Session
    ) -> Organization | None:
        return db.execute(
            select(Organization).where(Organization.organization_id == organization_id)
        ).scalar_one_or_none()

    @staticmethod
    def update_organization(
        organization_id: uuid.UUID, update_data: OrganizationUpdateRequest, db: Session
    ) -> Organization:
        organization = OrganizationService.get_organization_by_id(organization_id, db)
        if not organization:
            raise NotFoundError("Organization not found")

        if update_data.name is not None:
            organization.name = update_data.name
        if update_data.location_city is not None:
            organization.location_city = update_data.location_city
        if update_data.location_country is not None:
            organization.location_country = update_data.location_country
        if update_data.website is not None:
            organization.website = update_data.website
        if update_data.description is not None:
            organization.description = update_data.description
        if update_data.industry is not None:
            organization.industry = update_data.industry
        if update_data.founded_year is not None:
            organization.founded_year = update_data.founded_year

        organization.updated_at = get_datetime()

        db.add(organization)
        db.commit()
        db.refresh(organization)

        return organization

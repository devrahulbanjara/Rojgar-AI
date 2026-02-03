import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import NotFoundError, get_datetime
from app.models import Organization
from app.schemas.organization import OrganizationUpdateRequest


class OrganizationService:
    @staticmethod
    async def get_organization_by_id(
        organization_id: uuid.UUID, db: AsyncSession
    ) -> Organization | None:
        result = await db.execute(
            select(Organization).where(Organization.organization_id == organization_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update_organization(
        organization_id: uuid.UUID,
        update_data: OrganizationUpdateRequest,
        db: AsyncSession,
    ) -> Organization:
        organization = await OrganizationService.get_organization_by_id(
            organization_id, db
        )
        if not organization:
            raise NotFoundError(
                message="Organization not found",
                details={
                    "organization_id": str(organization_id),
                },
            )
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
        await db.commit()
        await db.refresh(organization)
        return organization

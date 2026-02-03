import uuid

from app.core import get_datetime
from app.db.models.organization import Organization
from app.db.repositories.user_repo import OrganizationRepository
from app.schemas.organization import OrganizationUpdateRequest


class OrganizationService:
    def __init__(self, organization_repo: OrganizationRepository):
        self.organization_repo = organization_repo

    async def get_organization_by_id(
        self, organization_id: uuid.UUID
    ) -> Organization | None:
        """Get organization by ID"""
        return await self.organization_repo.get(organization_id)

    async def update_organization(
        self,
        organization_id: uuid.UUID,
        update_data: OrganizationUpdateRequest,
    ) -> Organization | None:
        """Update organization"""
        organization = await self.get_organization_by_id(organization_id)
        if not organization:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        update_dict["updated_at"] = get_datetime()

        return await self.organization_repo.update(organization_id, **update_dict)

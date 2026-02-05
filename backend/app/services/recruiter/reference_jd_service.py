import uuid

from app.db.models.job import ReferenceJD
from app.db.repositories.job_repo import ReferenceJDRepository
from app.db.repositories.user_repo import OrganizationRepository
from app.schemas import job as schemas


class ReferenceJDService:
    def __init__(
        self,
        reference_jd_repo: ReferenceJDRepository,
        organization_repo: OrganizationRepository,
    ):
        self.reference_jd_repo = reference_jd_repo
        self.organization_repo = organization_repo

    async def create_reference_jd(
        self, organization_id: uuid.UUID, data: schemas.CreateReferenceJD
    ):
        """Create a new reference JD"""
        reference_jd = ReferenceJD(
            referncejd_id=uuid.uuid4(),
            organization_id=organization_id,
            department=data.department,
            job_summary=data.job_summary,
            job_responsibilities=data.job_responsibilities,
            required_qualifications=data.required_qualifications,
            preferred=data.preferred,
            compensation_and_benefits=data.compensation_and_benefits,
        )
        created_jd = await self.reference_jd_repo.create(reference_jd)
        # Add organization description
        organization = await self.organization_repo.get(organization_id)
        if organization:
            created_jd.about_the_company = organization.description
        return created_jd

    async def get_reference_jds(self, organization_id: uuid.UUID):
        """Get all reference JDs for an organization"""
        reference_jds = await self.reference_jd_repo.get_by_organization(
            organization_id
        )
        organization = await self.organization_repo.get(organization_id)
        org_description = organization.description if organization else None
        for ref_jd in reference_jds:
            ref_jd.about_the_company = org_description
        return reference_jds

    async def get_reference_jd_by_id(
        self, reference_jd_id: uuid.UUID, organization_id: uuid.UUID
    ):
        """Get a specific reference JD"""
        reference_jd = await self.reference_jd_repo.get(reference_jd_id)
        if not reference_jd or reference_jd.organization_id != organization_id:
            return None
        organization = await self.organization_repo.get(organization_id)
        if organization:
            reference_jd.about_the_company = organization.description
        return reference_jd

    async def delete_reference_jd(
        self, reference_jd_id: uuid.UUID, organization_id: uuid.UUID
    ):
        """Delete a reference JD
        
        Raises:
            ValueError: If deletion fails due to database constraints or errors
        """
        reference_jd = await self.get_reference_jd_by_id(
            reference_jd_id, organization_id
        )
        if reference_jd:
            # This will raise ValueError if deletion fails
            await self.reference_jd_repo.delete(reference_jd_id)
        return reference_jd

    async def update_reference_jd(
        self,
        reference_jd_id: uuid.UUID,
        organization_id: uuid.UUID,
        data: schemas.CreateReferenceJD,
    ):
        """Update a reference JD"""
        reference_jd = await self.get_reference_jd_by_id(
            reference_jd_id, organization_id
        )
        if not reference_jd:
            return None

        update_data = {
            "department": data.department,
            "job_summary": data.job_summary,
            "job_responsibilities": data.job_responsibilities,
            "required_qualifications": data.required_qualifications,
            "preferred": data.preferred,
            "compensation_and_benefits": data.compensation_and_benefits,
        }
        updated_jd = await self.reference_jd_repo.update(reference_jd_id, **update_data)
        organization = await self.organization_repo.get(organization_id)
        if organization and updated_jd:
            updated_jd.about_the_company = organization.description
        return updated_jd

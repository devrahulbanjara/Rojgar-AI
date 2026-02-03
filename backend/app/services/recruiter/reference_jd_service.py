import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Organization, ReferenceJobDescriptions
from app.schemas import job as schemas


class ReferenceJDService:
    @staticmethod
    async def create_reference_jd(
        db: AsyncSession, organization_id: uuid.UUID, data: schemas.CreateReferenceJD
    ):
        id = uuid.uuid4()
        reference_jd = ReferenceJobDescriptions(
            referncejd_id=id,
            organization_id=organization_id,
            department=data.department,
            job_summary=data.job_summary,
            job_responsibilities=data.job_responsibilities,
            required_qualifications=data.required_qualifications,
            preferred=data.preferred,
            compensation_and_benefits=data.compensation_and_benefits,
        )
        db.add(reference_jd)
        await db.commit()
        await db.refresh(reference_jd)
        reference_jd.about_the_company = (
            await ReferenceJDService._get_organization_description(db, organization_id)
        )
        return reference_jd

    @staticmethod
    async def _get_organization_description(
        db: AsyncSession, organization_id: uuid.UUID
    ) -> str | None:
        stmt = select(Organization).where(
            Organization.organization_id == organization_id
        )
        result = await db.execute(stmt)
        organization = result.scalar_one_or_none()
        return organization.description if organization else None

    @staticmethod
    async def get_reference_jds(db: AsyncSession, organization_id: uuid.UUID):
        stmt = select(ReferenceJobDescriptions).where(
            ReferenceJobDescriptions.organization_id == organization_id
        )
        result = await db.execute(stmt)
        reference_jds = result.scalars().all()
        organization_description = (
            await ReferenceJDService._get_organization_description(db, organization_id)
        )
        for ref_jd in reference_jds:
            ref_jd.about_the_company = organization_description
        return reference_jds

    @staticmethod
    async def get_reference_jd_by_id(
        db: AsyncSession, reference_jd_id: uuid.UUID, organization_id: uuid.UUID
    ):
        stmt = select(ReferenceJobDescriptions).where(
            ReferenceJobDescriptions.referncejd_id == reference_jd_id,
            ReferenceJobDescriptions.organization_id == organization_id,
        )
        result = await db.execute(stmt)
        reference_jd = result.scalar_one_or_none()
        if not reference_jd:
            return None
        reference_jd.about_the_company = (
            await ReferenceJDService._get_organization_description(db, organization_id)
        )
        return reference_jd

    @staticmethod
    async def delete_reference_jd(
        db: AsyncSession, reference_jd_id: uuid.UUID, organization_id: uuid.UUID
    ):
        stmt = select(ReferenceJobDescriptions).where(
            ReferenceJobDescriptions.referncejd_id == reference_jd_id,
            ReferenceJobDescriptions.organization_id == organization_id,
        )
        result = await db.execute(stmt)
        reference_jd = result.scalar_one_or_none()
        if reference_jd:
            db.delete(reference_jd)
            await db.commit()
        return reference_jd

    @staticmethod
    async def update_reference_jd(
        db: AsyncSession,
        reference_jd_id: uuid.UUID,
        organization_id: uuid.UUID,
        data: schemas.CreateReferenceJD,
    ):
        stmt = select(ReferenceJobDescriptions).where(
            ReferenceJobDescriptions.referncejd_id == reference_jd_id,
            ReferenceJobDescriptions.organization_id == organization_id,
        )
        result = await db.execute(stmt)
        reference_jd = result.scalar_one_or_none()
        if not reference_jd:
            return None
        reference_jd.department = data.department
        reference_jd.job_summary = data.job_summary
        reference_jd.job_responsibilities = data.job_responsibilities
        reference_jd.required_qualifications = data.required_qualifications
        reference_jd.preferred = data.preferred
        reference_jd.compensation_and_benefits = data.compensation_and_benefits
        await db.commit()
        await db.refresh(reference_jd)
        reference_jd.about_the_company = (
            await ReferenceJDService._get_organization_description(db, organization_id)
        )
        return reference_jd

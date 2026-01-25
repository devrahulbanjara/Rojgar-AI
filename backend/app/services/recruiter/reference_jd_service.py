import uuid

from sqlalchemy import select
from sqlalchemy.orm.session import Session

from app.models import Organization, ReferenceJobDescriptions
from app.schemas import job as schemas


class ReferenceJDService:
    @staticmethod
    def create_reference_jd(
        db: Session, organization_id: uuid.UUID, data: schemas.CreateReferenceJD
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
        db.commit()
        db.refresh(reference_jd)

        reference_jd.about_the_company = (
            ReferenceJDService._get_organization_description(db, organization_id)
        )

        return reference_jd

    @staticmethod
    def _get_organization_description(
        db: Session, organization_id: uuid.UUID
    ) -> str | None:
        stmt = select(Organization).where(
            Organization.organization_id == organization_id
        )
        organization = db.execute(stmt).scalar_one_or_none()

        return organization.description if organization else None

    @staticmethod
    def get_reference_jds(db: Session, organization_id: uuid.UUID):
        stmt = select(ReferenceJobDescriptions).where(
            ReferenceJobDescriptions.organization_id == organization_id
        )
        reference_jds = db.execute(stmt).scalars().all()

        organization_description = ReferenceJDService._get_organization_description(
            db, organization_id
        )

        for ref_jd in reference_jds:
            ref_jd.about_the_company = organization_description

        return reference_jds

    @staticmethod
    def get_reference_jd_by_id(
        db: Session, reference_jd_id: uuid.UUID, organization_id: uuid.UUID
    ):
        stmt = select(ReferenceJobDescriptions).where(
            ReferenceJobDescriptions.referncejd_id == reference_jd_id,
            ReferenceJobDescriptions.organization_id == organization_id,
        )
        reference_jd = db.execute(stmt).scalar_one_or_none()

        if not reference_jd:
            return None

        # Inject about_the_company into the model temporarily for the schema
        # This is a bit of a hack, but cleaner than manual mapping in controller
        reference_jd.about_the_company = (
            ReferenceJDService._get_organization_description(db, organization_id)
        )

        return reference_jd

    @staticmethod
    def delete_reference_jd(
        db: Session, reference_jd_id: uuid.UUID, organization_id: uuid.UUID
    ):
        stmt = select(ReferenceJobDescriptions).where(
            ReferenceJobDescriptions.referncejd_id == reference_jd_id,
            ReferenceJobDescriptions.organization_id == organization_id,
        )
        reference_jd = db.execute(stmt).scalar_one_or_none()

        if not reference_jd:
            raise NotFoundError("Reference JD not found")

        db.delete(reference_jd)
        db.commit()

    @staticmethod
    def update_reference_jd(
        db: Session,
        reference_jd_id: uuid.UUID,
        organization_id: uuid.UUID,
        data: schemas.CreateReferenceJD,
    ):
        stmt = select(ReferenceJobDescriptions).where(
            ReferenceJobDescriptions.referncejd_id == reference_jd_id,
            ReferenceJobDescriptions.organization_id == organization_id,
        )
        reference_jd = db.execute(stmt).scalar_one_or_none()

        if not reference_jd:
            raise NotFoundError("Reference JD not found")

        reference_jd.department = data.department
        reference_jd.job_summary = data.job_summary
        reference_jd.job_responsibilities = data.job_responsibilities
        reference_jd.required_qualifications = data.required_qualifications
        reference_jd.preferred = data.preferred
        reference_jd.compensation_and_benefits = data.compensation_and_benefits

        db.commit()
        db.refresh(reference_jd)

        reference_jd.about_the_company = (
            ReferenceJDService._get_organization_description(db, organization_id)
        )

        return reference_jd

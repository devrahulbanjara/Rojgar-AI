import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm.session import Session

from app.models import Organization, ReferenceJobDescriptions
from app.schemas import job as schemas


class ReferenceJDService:
    @staticmethod
    def create_reference_jd(
        db: Session, organization_id: str, data: schemas.CreateReferenceJD
    ):
        id = str(uuid.uuid4())
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

        about_the_company = ReferenceJDService._get_organization_description(
            db, organization_id
        )

        return reference_jd, about_the_company

    @staticmethod
    def _get_organization_description(db: Session, organization_id: str) -> str | None:
        organization = (
            db.query(Organization)
            .filter(Organization.organization_id == organization_id)
            .first()
        )

        return organization.description if organization else None

    @staticmethod
    def get_reference_jds(db: Session, organization_id: str):
        reference_jds = (
            db.query(ReferenceJobDescriptions)
            .filter(ReferenceJobDescriptions.organization_id == organization_id)
            .all()
        )

        organization_description = ReferenceJDService._get_organization_description(
            db, organization_id
        )

        return reference_jds, organization_description

    @staticmethod
    def get_reference_jd_by_id(db: Session, reference_jd_id: str, organization_id: str):
        reference_jd = (
            db.query(ReferenceJobDescriptions)
            .filter(
                ReferenceJobDescriptions.referncejd_id == reference_jd_id,
                ReferenceJobDescriptions.organization_id == organization_id,
            )
            .first()
        )

        if not reference_jd:
            return None, None

        organization_description = ReferenceJDService._get_organization_description(
            db, organization_id
        )

        return reference_jd, organization_description

    @staticmethod
    def delete_reference_jd(db: Session, reference_jd_id: str, organization_id: str):
        reference_jd = (
            db.query(ReferenceJobDescriptions)
            .filter(
                ReferenceJobDescriptions.referncejd_id == reference_jd_id,
                ReferenceJobDescriptions.organization_id == organization_id,
            )
            .first()
        )

        if not reference_jd:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reference JD not found",
            )

        db.delete(reference_jd)
        db.commit()

    @staticmethod
    def update_reference_jd(
        db: Session,
        reference_jd_id: str,
        organization_id: str,
        data: schemas.CreateReferenceJD,
    ):
        reference_jd = (
            db.query(ReferenceJobDescriptions)
            .filter(
                ReferenceJobDescriptions.referncejd_id == reference_jd_id,
                ReferenceJobDescriptions.organization_id == organization_id,
            )
            .first()
        )

        if not reference_jd:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reference JD not found",
            )

        reference_jd.department = data.department
        reference_jd.job_summary = data.job_summary
        reference_jd.job_responsibilities = data.job_responsibilities
        reference_jd.required_qualifications = data.required_qualifications
        reference_jd.preferred = data.preferred
        reference_jd.compensation_and_benefits = data.compensation_and_benefits

        db.commit()
        db.refresh(reference_jd)

        about_the_company = ReferenceJDService._get_organization_description(
            db, organization_id
        )

        return reference_jd, about_the_company

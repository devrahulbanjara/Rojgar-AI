import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core import (
    BusinessLogicError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
)
from app.models.application import (
    ApplicationStatus,
    JobApplication,
    JobApplicationStatusHistory,
)
from app.models.candidate import CandidateProfile
from app.models.job import JobPosting
from app.models.resume import Resume


class ApplicationService:
    @staticmethod
    def _get_profile_id(db: Session, user_id: uuid.UUID) -> uuid.UUID:
        """Internal helper to fetch profile_id or raise 404."""
        profile_id = db.scalar(
            select(CandidateProfile.profile_id).where(
                CandidateProfile.user_id == user_id
            )
        )
        if not profile_id:
            raise NotFoundError("Candidate profile not found")
        return profile_id

    @staticmethod
    def get_candidate_applications(
        db: Session, user_id: uuid.UUID
    ) -> list[JobApplication]:
        profile_id = ApplicationService._get_profile_id(db, user_id)

        stmt = (
            select(JobApplication)
            .where(JobApplication.candidate_profile_id == profile_id)
            .options(
                selectinload(JobApplication.job),
                selectinload(JobApplication.organization),
            )
            .order_by(JobApplication.updated_at.desc())
        )
        return list(db.execute(stmt).scalars().all())

    @staticmethod
    def get_application_by_id(
        db: Session, user_id: uuid.UUID, application_id: uuid.UUID
    ) -> JobApplication:
        profile_id = ApplicationService._get_profile_id(db, user_id)

        stmt = (
            select(JobApplication)
            .where(
                JobApplication.application_id == application_id,
                JobApplication.candidate_profile_id == profile_id,
            )
            .options(
                selectinload(JobApplication.job),
                selectinload(JobApplication.organization),
                selectinload(JobApplication.resume),
                selectinload(JobApplication.history),
            )
        )
        application = db.execute(stmt).scalar_one_or_none()
        if not application:
            raise NotFoundError("Application not found")
        return application

    @staticmethod
    def get_application_by_job(
        db: Session, user_id: uuid.UUID, job_id: uuid.UUID
    ) -> JobApplication | None:
        profile_id = ApplicationService._get_profile_id(db, user_id)

        stmt = (
            select(JobApplication)
            .where(
                JobApplication.job_id == job_id,
                JobApplication.candidate_profile_id == profile_id,
            )
            .options(
                selectinload(JobApplication.job),
                selectinload(JobApplication.organization),
            )
        )
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def apply_to_job(
        db: Session, user_id: uuid.UUID, job_id: uuid.UUID, resume_id: uuid.UUID
    ) -> JobApplication:
        profile_id = ApplicationService._get_profile_id(db, user_id)

        # Validate job exists and is active
        job = db.scalar(select(JobPosting).where(JobPosting.job_id == job_id))

        if not job:
            raise NotFoundError("Job not found")
        if job.status != "active":
            raise BusinessLogicError("Job is no longer accepting applications")

        # Validate resume belongs to candidate
        resume_profile_id = db.scalar(
            select(Resume.profile_id).where(Resume.resume_id == resume_id)
        )

        if not resume_profile_id:
            raise NotFoundError("Resume not found")
        if resume_profile_id != profile_id:
            raise ForbiddenError("Unauthorized resume usage")

        # Check for duplicate application
        already_applied = db.scalar(
            select(JobApplication.application_id).where(
                JobApplication.candidate_profile_id == profile_id,
                JobApplication.job_id == job_id,
            )
        )
        if already_applied:
            raise ConflictError("You have already applied for this job")

        # Create application
        app_id = uuid.uuid4()
        new_application = JobApplication(
            application_id=app_id,
            candidate_profile_id=profile_id,
            job_id=job_id,
            organization_id=job.organization_id,
            resume_id=resume_id,
            current_status=ApplicationStatus.APPLIED,
        )

        # Create status history
        history = JobApplicationStatusHistory(
            status_history_id=uuid.uuid4(),
            application_id=app_id,
            status=ApplicationStatus.APPLIED,
        )

        db.add_all([new_application, history])
        db.commit()

        from app.models.user import User

        candidate_user = db.scalar(select(User).where(User.user_id == user_id))
        candidate_name = candidate_user.name if candidate_user else "Unknown Candidate"

        return ApplicationService.get_application_by_id(db, user_id, app_id), {
            "organization_id": job.organization_id,
            "candidate_name": candidate_name,
            "job_title": job.title,
            "application_id": app_id,
            "job_id": job_id,
            "timestamp": new_application.applied_at,
        }

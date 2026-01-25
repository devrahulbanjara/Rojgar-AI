import uuid
from sqlalchemy import select, delete
from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException, status

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
    def _get_profile_id(db: Session, user_id: str) -> str:
        """Internal helper to fetch profile_id or raise 404."""
        profile_id = db.scalar(
            select(CandidateProfile.profile_id).where(
                CandidateProfile.user_id == user_id
            )
        )
        if not profile_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate profile not found",
            )
        return profile_id

    @staticmethod
    def get_candidate_applications(db: Session, user_id: str) -> list[JobApplication]:
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
        db: Session, user_id: str, application_id: str
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
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found",
            )
        return application

    @staticmethod
    def get_application_by_job(
        db: Session, user_id: str, job_id: str
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
        db: Session, user_id: str, job_id: str, resume_id: str
    ) -> JobApplication:
        profile_id = ApplicationService._get_profile_id(db, user_id)

        # Validate job exists and is active
        job = db.scalar(select(JobPosting).where(JobPosting.job_id == job_id))

        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        if job.status != "active":
            raise HTTPException(
                status_code=400, detail="Job is no longer accepting applications"
            )

        # Validate resume belongs to candidate
        resume_profile_id = db.scalar(
            select(Resume.profile_id).where(Resume.resume_id == resume_id)
        )

        if not resume_profile_id:
            raise HTTPException(status_code=404, detail="Resume not found")
        if resume_profile_id != profile_id:
            raise HTTPException(status_code=403, detail="Unauthorized resume usage")

        # Check for duplicate application
        already_applied = db.scalar(
            select(JobApplication.application_id).where(
                JobApplication.candidate_profile_id == profile_id,
                JobApplication.job_id == job_id,
            )
        )
        if already_applied:
            raise HTTPException(
                status_code=409, detail="You have already applied for this job"
            )

        # Create application
        app_id = str(uuid.uuid4())
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
            status_history_id=str(uuid.uuid4()),
            application_id=app_id,
            status=ApplicationStatus.APPLIED,
        )

        db.add_all([new_application, history])
        db.commit()

        # Re-fetch with relations using the modern executable select
        return ApplicationService.get_application_by_id(db, user_id, app_id)

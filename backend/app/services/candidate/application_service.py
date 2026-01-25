import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

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
    def get_candidate_applications(db: Session, user_id: str):
        stmt = select(CandidateProfile.profile_id).where(
            CandidateProfile.user_id == user_id
        )
        profile_id = db.execute(stmt).scalar_one_or_none()

        if not profile_id:
            return []

        stmt = (
            select(JobApplication)
            .where(JobApplication.candidate_profile_id == profile_id)
            .options(
                selectinload(JobApplication.job),
                selectinload(JobApplication.organization),
            )
            .order_by(JobApplication.updated_at.desc())
        )
        apps = db.execute(stmt).scalars().all()
        return apps

    @staticmethod
    def apply_to_job(db: Session, user_id: str, job_id: str, resume_id: str):
        # Get candidate profile
        profile_stmt = select(CandidateProfile.profile_id).where(
            CandidateProfile.user_id == user_id
        )
        profile_id = db.execute(profile_stmt).scalar_one_or_none()
        if not profile_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate profile not found",
            )

        # Validate job exists and is active
        job_stmt = select(JobPosting).where(JobPosting.job_id == job_id)
        job = db.execute(job_stmt).scalar_one_or_none()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
            )
        if job.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job is not active",
            )

        # Validate resume belongs to candidate
        resume_stmt = select(Resume).where(Resume.resume_id == resume_id)
        resume = db.execute(resume_stmt).scalar_one_or_none()
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found"
            )
        if resume.profile_id != profile_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Resume does not belong to candidate",
            )

        # Check for duplicate application
        duplicate_stmt = select(JobApplication).where(
            JobApplication.candidate_profile_id == profile_id,
            JobApplication.job_id == job_id,
        )
        existing = db.execute(duplicate_stmt).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Application already exists for this job",
            )

        # Create application
        application_id = str(uuid.uuid4())
        application = JobApplication(
            application_id=application_id,
            candidate_profile_id=profile_id,
            job_id=job_id,
            organization_id=job.organization_id,
            resume_id=resume_id,
            current_status=ApplicationStatus.APPLIED,
        )
        db.add(application)

        # Create status history
        status_history = JobApplicationStatusHistory(
            status_history_id=str(uuid.uuid4()),
            application_id=application_id,
            status=ApplicationStatus.APPLIED,
        )
        db.add(status_history)

        db.commit()
        db.refresh(application)

        # Load relationships for response
        stmt = (
            select(JobApplication)
            .where(JobApplication.application_id == application_id)
            .options(
                selectinload(JobApplication.job),
                selectinload(JobApplication.organization),
            )
        )
        application_with_relations = db.execute(stmt).scalar_one()

        return application_with_relations

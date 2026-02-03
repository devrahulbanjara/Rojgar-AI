import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.application import (
    ApplicationStatus,
    JobApplication,
    JobApplicationStatusHistory,
)
from app.models.candidate import CandidateProfile
from app.models.job import JobPosting
from app.models.resume import Resume
from app.models.user import User


class ApplicationService:
    @staticmethod
    async def _get_profile_id(db: AsyncSession, user_id: uuid.UUID) -> uuid.UUID | None:
        result = await db.execute(
            select(CandidateProfile.profile_id).where(
                CandidateProfile.user_id == user_id
            )
        )
        profile_id = result.scalar_one_or_none()
        return profile_id

    @staticmethod
    async def get_candidate_applications(
        db: AsyncSession, user_id: uuid.UUID
    ) -> list[JobApplication] | None:
        profile_id = await ApplicationService._get_profile_id(db, user_id)
        if not profile_id:
            return None
        stmt = (
            select(JobApplication)
            .where(JobApplication.candidate_profile_id == profile_id)
            .options(
                selectinload(JobApplication.job),
                selectinload(JobApplication.organization),
            )
            .order_by(JobApplication.updated_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_application_by_id(
        db: AsyncSession, user_id: uuid.UUID, application_id: uuid.UUID
    ) -> JobApplication | None:
        profile_id = await ApplicationService._get_profile_id(db, user_id)
        if not profile_id:
            return None
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
        result = await db.execute(stmt)
        application = result.scalar_one_or_none()
        return application

    @staticmethod
    async def get_application_by_job(
        db: AsyncSession, user_id: uuid.UUID, job_id: uuid.UUID
    ) -> JobApplication | None:
        profile_id = await ApplicationService._get_profile_id(db, user_id)
        if not profile_id:
            return None
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
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def apply_to_job(
        db: AsyncSession, user_id: uuid.UUID, job_id: uuid.UUID, resume_id: uuid.UUID
    ) -> tuple[JobApplication, dict] | None:
        profile_id = await ApplicationService._get_profile_id(db, user_id)
        if not profile_id:
            return None
        job_result = await db.execute(
            select(JobPosting).where(JobPosting.job_id == job_id)
        )
        job = job_result.scalar_one_or_none()
        if not job:
            return None
        if job.status != "active":
            raise ValueError("Job is no longer accepting applications")
        resume_result = await db.execute(
            select(Resume.profile_id).where(Resume.resume_id == resume_id)
        )
        resume_profile_id = resume_result.scalar_one_or_none()
        if not resume_profile_id:
            return None
        if resume_profile_id != profile_id:
            raise ValueError("Unauthorized resume usage")
        already_applied_result = await db.execute(
            select(JobApplication).where(
                JobApplication.candidate_profile_id == profile_id,
                JobApplication.job_id == job_id,
            )
        )
        existing_application = already_applied_result.scalar_one_or_none()
        if existing_application:
            raise ValueError("You have already applied for this job")
        app_id = uuid.uuid4()
        new_application = JobApplication(
            application_id=app_id,
            candidate_profile_id=profile_id,
            job_id=job_id,
            organization_id=job.organization_id,
            resume_id=resume_id,
            current_status=ApplicationStatus.APPLIED,
        )
        history = JobApplicationStatusHistory(
            status_history_id=uuid.uuid4(),
            application_id=app_id,
            status=ApplicationStatus.APPLIED,
        )
        db.add_all([new_application, history])
        await db.commit()
        user_result = await db.execute(select(User).where(User.user_id == user_id))
        candidate_user = user_result.scalar_one_or_none()
        candidate_name = candidate_user.name if candidate_user else "Unknown Candidate"
        application = await ApplicationService.get_application_by_id(
            db, user_id, app_id
        )
        return (
            application,
            {
                "organization_id": job.organization_id,
                "candidate_name": candidate_name,
                "job_title": job.title,
                "application_id": app_id,
                "job_id": job_id,
                "timestamp": new_application.applied_at,
            },
        )

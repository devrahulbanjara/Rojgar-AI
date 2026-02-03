import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, selectinload

from app.core import BusinessLogicError, ConflictError, ForbiddenError, NotFoundError
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
    async def _get_profile_id(db: AsyncSession, user_id: uuid.UUID) -> uuid.UUID:
        result = await db.execute(
            select(CandidateProfile.profile_id).where(
                CandidateProfile.user_id == user_id
            )
        )
        profile_id = result.scalar_one_or_none()
        if not profile_id:
            raise NotFoundError(
                message="Candidate profile not found",
                details={
                    "user_id": str(user_id),
                    "reason": "profile_not_created",
                },
                user_id=user_id,
            )
        return profile_id

    @staticmethod
    async def get_candidate_applications(
        db: AsyncSession, user_id: uuid.UUID
    ) -> list[JobApplication]:
        profile_id = await ApplicationService._get_profile_id(db, user_id)
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
    ) -> JobApplication:
        profile_id = await ApplicationService._get_profile_id(db, user_id)
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
        if not application:
            raise NotFoundError(
                message="Application not found",
                details={
                    "application_id": str(application_id),
                    "user_id": str(user_id),
                    "profile_id": str(profile_id),
                },
                user_id=user_id,
            )
        return application

    @staticmethod
    async def get_application_by_job(
        db: AsyncSession, user_id: uuid.UUID, job_id: uuid.UUID
    ) -> JobApplication | None:
        profile_id = await ApplicationService._get_profile_id(db, user_id)
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
    ) -> tuple[JobApplication, dict]:
        profile_id = await ApplicationService._get_profile_id(db, user_id)
        job_result = await db.execute(
            select(JobPosting).where(JobPosting.job_id == job_id)
        )
        job = job_result.scalar_one_or_none()
        if not job:
            raise NotFoundError(
                message="Job not found",
                details={
                    "job_id": str(job_id),
                    "user_id": str(user_id),
                },
                user_id=user_id,
            )
        if job.status != "active":
            raise BusinessLogicError(
                message="Job is no longer accepting applications",
                details={
                    "job_id": str(job_id),
                    "job_title": job.title,
                    "job_status": job.status,
                    "user_id": str(user_id),
                },
                user_id=user_id,
            )
        resume_result = await db.execute(
            select(Resume.profile_id).where(Resume.resume_id == resume_id)
        )
        resume_profile_id = resume_result.scalar_one_or_none()
        if not resume_profile_id:
            raise NotFoundError(
                message="Resume not found",
                details={
                    "resume_id": str(resume_id),
                    "user_id": str(user_id),
                    "profile_id": str(profile_id),
                },
                user_id=user_id,
            )
        if resume_profile_id != profile_id:
            raise ForbiddenError(
                message="Unauthorized resume usage",
                details={
                    "resume_id": str(resume_id),
                    "resume_profile_id": str(resume_profile_id),
                    "user_profile_id": str(profile_id),
                    "user_id": str(user_id),
                },
                user_id=user_id,
            )
        already_applied_result = await db.execute(
            select(JobApplication).where(
                JobApplication.candidate_profile_id == profile_id,
                JobApplication.job_id == job_id,
            )
        )
        existing_application = already_applied_result.scalar_one_or_none()
        if existing_application:
            raise ConflictError(
                message="You have already applied for this job",
                details={
                    "job_id": str(job_id),
                    "job_title": job.title,
                    "application_id": str(existing_application.application_id),
                    "application_status": existing_application.current_status.value,
                    "applied_at": existing_application.applied_at.isoformat()
                    if existing_application.applied_at
                    else None,
                    "user_id": str(user_id),
                },
                user_id=user_id,
            )
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

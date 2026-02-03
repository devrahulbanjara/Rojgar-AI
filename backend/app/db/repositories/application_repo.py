import uuid
from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.application import JobApplication, JobApplicationStatusHistory
from app.db.models.candidate import CandidateProfile
from app.db.models.job import JobDescription, JobPosting
from app.db.models.user import User
from app.db.repositories.base import BaseRepository


class JobApplicationRepository(BaseRepository[JobApplication]):
    def __init__(self, db: AsyncSession):
        super().__init__(JobApplication, db)

    async def get_by_candidate_and_job(
        self, candidate_profile_id: uuid.UUID, job_id: uuid.UUID
    ) -> JobApplication | None:
        """Get application by candidate and job"""
        query = select(JobApplication).where(
            JobApplication.candidate_profile_id == candidate_profile_id,
            JobApplication.job_id == job_id,
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_with_details(
        self, application_id: uuid.UUID
    ) -> JobApplication | None:
        """Get application with job, organization, and resume details"""
        query = (
            select(JobApplication)
            .options(
                selectinload(JobApplication.job).selectinload(JobPosting.job_description),
                selectinload(JobApplication.organization),
                selectinload(JobApplication.resume),
            )
            .where(JobApplication.application_id == application_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_candidate(
        self, user_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> Sequence[JobApplication]:
        """Get applications by candidate user ID"""
        query = (
            select(JobApplication)
            .options(
                selectinload(JobApplication.job).selectinload(JobPosting.organization),
                selectinload(JobApplication.job).selectinload(
                    JobPosting.job_description
                ),
            )
            .join(
                CandidateProfile,
                JobApplication.candidate_profile_id == CandidateProfile.profile_id,
            )
            .where(CandidateProfile.user_id == user_id)
            .order_by(JobApplication.applied_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_job(
        self, job_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> Sequence[JobApplication]:
        """Get applications by job ID"""
        from app.db.models.resume import Resume

        query = (
            select(JobApplication)
            .options(
                selectinload(JobApplication.resume).selectinload(
                    Resume.work_experiences
                ),
                selectinload(JobApplication.resume).selectinload(Resume.educations),
                selectinload(JobApplication.resume).selectinload(Resume.skills),
                selectinload(JobApplication.resume).selectinload(Resume.certifications),
                selectinload(JobApplication.resume).selectinload(Resume.social_links),
                selectinload(JobApplication.candidate_profile).selectinload(
                    CandidateProfile.user
                ),
            )
            .where(JobApplication.job_id == job_id)
            .order_by(JobApplication.applied_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_organization(
        self, organization_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> Sequence[JobApplication]:
        """Get applications by organization ID"""
        query = (
            select(JobApplication)
            .options(
                selectinload(JobApplication.job).selectinload(
                    JobPosting.job_description
                ),
                selectinload(JobApplication.job).selectinload(JobPosting.created_by),
                selectinload(JobApplication.resume),
                selectinload(JobApplication.candidate_profile).selectinload(
                    CandidateProfile.user
                ),
                selectinload(JobApplication.history),
            )
            .where(JobApplication.organization_id == organization_id)
            .order_by(JobApplication.applied_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def count_by_organization(self, organization_id: uuid.UUID) -> int:
        """Count applications by organization"""
        query = select(func.count(JobApplication.application_id)).where(
            JobApplication.organization_id == organization_id
        )
        result = await self.db.execute(query)
        return result.scalar_one() or 0

    async def count_by_job(self, job_id: uuid.UUID) -> int:
        """Count applications by job"""
        query = select(func.count(JobApplication.application_id)).where(
            JobApplication.job_id == job_id
        )
        result = await self.db.execute(query)
        return result.scalar_one() or 0

    async def has_applied(self, user_id: uuid.UUID, job_id: uuid.UUID) -> bool:
        """Check if user has applied to a job"""
        query = (
            select(JobApplication.application_id)
            .join(
                CandidateProfile,
                JobApplication.candidate_profile_id == CandidateProfile.profile_id,
            )
            .where(CandidateProfile.user_id == user_id, JobApplication.job_id == job_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None


class JobApplicationStatusHistoryRepository(
    BaseRepository[JobApplicationStatusHistory]
):
    def __init__(self, db: AsyncSession):
        super().__init__(JobApplicationStatusHistory, db)

    async def get_by_application(
        self, application_id: uuid.UUID
    ) -> Sequence[JobApplicationStatusHistory]:
        """Get status history by application ID"""
        query = (
            select(JobApplicationStatusHistory)
            .where(JobApplicationStatusHistory.application_id == application_id)
            .order_by(JobApplicationStatusHistory.changed_at.desc())
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def add_status_change(
        self, application_id: uuid.UUID, status: str
    ) -> JobApplicationStatusHistory:
        """Add a status change record"""
        import uuid as uuid_lib

        from app.db.models.application import JobApplicationStatusHistory

        status_history = JobApplicationStatusHistory(
            status_history_id=uuid_lib.uuid4(),
            application_id=application_id,
            status=status,
        )
        return await self.create(status_history)

import math
import uuid
from collections.abc import Sequence
from datetime import date

from sqlalchemy import case, delete, func, or_, select, update
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core import get_datetime
from app.db.models.application import (
    JobApplication,
    JobApplicationStatusHistory,
)
from app.db.models.job import JobDescription, JobPosting, ReferenceJD
from app.db.models.user import User
from app.db.repositories.base import BaseRepository

VISIBLE_STATUSES = ["active"]


class JobRepository(BaseRepository[JobPosting]):
    def __init__(self, db: AsyncSession):
        super().__init__(JobPosting, db)

    async def get_with_details(self, job_id: uuid.UUID) -> JobPosting | None:
        """Get job with organization and description details"""
        query = (
            select(JobPosting)
            .options(
                selectinload(JobPosting.organization),
                selectinload(JobPosting.job_description),
            )
            .where(JobPosting.job_id == job_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_visible_jobs_paginated(
        self,
        page: int = 1,
        limit: int = 10,
        employment_type: str | None = None,
        location_type: str | None = None,
        job_ids: list[uuid.UUID] | None = None,
        order_by_date: bool = True,
    ) -> dict:
        """Get paginated visible jobs with filters"""
        today = date.today()
        base_stmt = (
            select(JobPosting)
            .options(
                selectinload(JobPosting.organization),
                selectinload(JobPosting.job_description),
            )
            .where(
                JobPosting.status.in_(VISIBLE_STATUSES),
                or_(
                    JobPosting.application_deadline.is_(None),
                    JobPosting.application_deadline >= today,
                ),
            )
        )

        # Apply filters
        if job_ids:
            base_stmt = base_stmt.where(JobPosting.job_id.in_(job_ids))

        if employment_type:
            base_stmt = base_stmt.where(JobPosting.employment_type == employment_type)

        if location_type:
            base_stmt = base_stmt.where(JobPosting.location_type == location_type)

        if job_ids and not order_by_date:
            order_mapping = {job_id: idx for idx, job_id in enumerate(job_ids)}
            order_case = case(order_mapping, value=JobPosting.job_id)
            base_stmt = base_stmt.order_by(order_case)
        elif order_by_date:
            base_stmt = base_stmt.order_by(JobPosting.posted_date.desc())

        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar_one() or 0

        offset = (page - 1) * limit
        jobs_stmt = base_stmt.offset(offset).limit(limit)
        jobs_result = await self.db.execute(jobs_stmt)
        jobs = jobs_result.scalars().all()

        if job_ids and not order_by_date:
            job_order = {job_id: idx for idx, job_id in enumerate(job_ids)}
            jobs = sorted(jobs, key=lambda job: job_order.get(job.job_id, float("inf")))

        total_pages = math.ceil(total / limit) if limit > 0 else 0

        return {
            "jobs": jobs,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }

    async def get_by_organization(
        self, organization_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> Sequence[JobPosting]:
        """Get jobs by organization"""
        query = (
            select(JobPosting)
            .options(selectinload(JobPosting.job_description))
            .where(JobPosting.organization_id == organization_id)
            .order_by(JobPosting.posted_date.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_user_organization(
        self, user_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> Sequence[JobPosting]:
        """Get jobs by user's organization"""
        query = (
            select(JobPosting)
            .options(selectinload(JobPosting.job_description))
            .join(User, JobPosting.organization_id == User.organization_id)
            .where(User.user_id == user_id)
            .order_by(JobPosting.posted_date.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def create_with_description(
        self, job_posting: JobPosting, job_description: JobDescription
    ) -> JobPosting:
        """Create job posting with description"""
        self.db.add(job_description)
        await self.db.flush()

        job_posting.job_description_id = job_description.job_description_id
        self.db.add(job_posting)
        await self.db.flush()

        return job_posting

    async def get_jobs_to_auto_shortlist(self) -> list[uuid.UUID]:
        """Get job IDs that should be auto-shortlisted (expired and auto_shortlist=True)"""
        today = date.today()
        query = select(JobPosting.job_id).where(
            JobPosting.status == "active",
            JobPosting.application_deadline < today,
            JobPosting.auto_shortlist == True,
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def expire_jobs(self) -> int:
        """Expire jobs past their application deadline"""
        today = date.today()
        update_stmt = (
            update(JobPosting)
            .where(
                JobPosting.status == "active", JobPosting.application_deadline < today
            )
            .values(status="expired", updated_at=get_datetime())
        )
        result = await self.db.execute(update_stmt)
        await self.db.flush()
        return result.rowcount

    async def get_jobs_paginated(
        self,
        user_id: uuid.UUID | None = None,
        organization_id: uuid.UUID | None = None,
        status: str | None = None,
        page: int = 1,
        limit: int = 10,
    ) -> dict:
        """Get paginated jobs with filters for recruiter view"""
        query = select(JobPosting)
        is_recruiter_view = False

        if user_id:
            is_recruiter_view = True
            # Get user's organization and filter by it
            user_query = select(User).where(User.user_id == user_id)
            user_result = await self.db.execute(user_query)
            user = user_result.scalar_one_or_none()
            if user and user.organization_id:
                query = query.where(JobPosting.organization_id == user.organization_id)
            else:
                # Return empty pagination if user has no organization
                return self._empty_pagination_response(page, limit)
        elif organization_id:
            query = query.where(JobPosting.organization_id == organization_id)

        if status:
            query = query.where(JobPosting.status == status)
        elif not is_recruiter_view:
            query = query.where(JobPosting.status.in_(VISIBLE_STATUSES))

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one() or 0

        # Get paginated results
        offset = (page - 1) * limit
        jobs_query = (
            query.options(
                selectinload(JobPosting.organization),
                selectinload(JobPosting.job_description),
            )
            .order_by(JobPosting.posted_date.desc())
            .offset(offset)
            .limit(limit)
        )
        jobs_result = await self.db.execute(jobs_query)
        jobs = jobs_result.scalars().all()

        total_pages = math.ceil(total / limit) if limit > 0 else 0

        return {
            "jobs": jobs,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }

    def _empty_pagination_response(self, page: int, limit: int) -> dict:
        """Return empty pagination response"""
        return {
            "jobs": [],
            "total": 0,
            "page": page,
            "limit": limit,
            "total_pages": 0,
            "has_next": False,
            "has_prev": False,
        }

    async def expire_job(self, job_id: uuid.UUID) -> JobPosting | None:
        """Expire a specific job"""
        job = await self.get(job_id)
        if job:
            job.status = "expired"
            job.updated_at = get_datetime()
            await self.db.flush()
        return job

    async def delete_job_cascade(self, job_id: uuid.UUID) -> bool:
        """Delete job and all related data (applications, etc.)

        Raises:
            ValueError: If deletion fails due to foreign key constraints or other database errors
        """
        job = await self.get(job_id)
        if not job:
            return False

        try:
            # 1. Cleanup related data (Use explicit deletes for clarity)
            # Note: In a larger app, setting 'ondelete="CASCADE"' in Models is better
            # but for manual code, this order is correct:

            # Delete history via subquery
            await self.db.execute(
                delete(JobApplicationStatusHistory).where(
                    JobApplicationStatusHistory.application_id.in_(
                        select(JobApplication.application_id).where(
                            JobApplication.job_id == job_id
                        )
                    )
                )
            )

            # Delete applications
            await self.db.execute(
                delete(JobApplication).where(JobApplication.job_id == job_id)
            )

            # 2. Delete the Job (this also triggers the JobDescription delete if logic matches)
            job_desc_id = job.job_description_id
            await self.db.delete(job)
            await self.db.execute(
                delete(JobDescription).where(
                    JobDescription.job_description_id == job_desc_id
                )
            )

            await self.db.flush()
            return True
        except (IntegrityError, SQLAlchemyError) as e:
            # Use a specific message for Jobs
            await self._handle_db_error(
                e,
                "Cannot delete job: It has active applications or historical data that cannot be removed.",
            )

    async def update_job_and_description(
        self, job_posting: JobPosting, job_data
    ) -> JobPosting:
        """Update job posting and its description"""
        # Update job posting fields
        if job_data.title is not None:
            job_posting.title = job_data.title
        if job_data.department is not None:
            job_posting.department = job_data.department
        if job_data.level is not None:
            job_posting.level = job_data.level
        if job_data.location_city is not None:
            job_posting.location_city = job_data.location_city
        if job_data.location_country is not None:
            job_posting.location_country = job_data.location_country
        if job_data.location_type is not None:
            job_posting.location_type = job_data.location_type
        if job_data.employment_type is not None:
            job_posting.employment_type = job_data.employment_type
        if job_data.salary_min is not None:
            job_posting.salary_min = job_data.salary_min
        if job_data.salary_max is not None:
            job_posting.salary_max = job_data.salary_max
        if job_data.salary_currency is not None:
            job_posting.salary_currency = job_data.salary_currency
        if job_data.status is not None:
            job_posting.status = job_data.status
        if job_data.application_deadline is not None:
            job_posting.application_deadline = job_data.application_deadline
        if hasattr(job_data, "auto_shortlist") and job_data.auto_shortlist is not None:
            job_posting.auto_shortlist = job_data.auto_shortlist
        job_posting.updated_at = get_datetime()

        # Update job description
        job_desc_query = select(JobDescription).where(
            JobDescription.job_description_id == job_posting.job_description_id
        )
        job_desc_result = await self.db.execute(job_desc_query)
        job_description = job_desc_result.scalar_one_or_none()

        if job_description:
            if job_data.job_summary is not None:
                job_description.job_summary = job_data.job_summary
            if job_data.job_responsibilities is not None:
                job_description.job_responsibilities = job_data.job_responsibilities
            if job_data.required_qualifications is not None:
                job_description.required_qualifications = (
                    job_data.required_qualifications
                )
            if job_data.preferred is not None:
                job_description.preferred = job_data.preferred
            if job_data.compensation_and_benefits is not None:
                job_description.compensation_and_benefits = (
                    job_data.compensation_and_benefits
                )
            job_description.updated_at = get_datetime()

        await self.db.flush()
        return job_posting


class JobDescriptionRepository(BaseRepository[JobDescription]):
    def __init__(self, db: AsyncSession):
        super().__init__(JobDescription, db)


class ReferenceJDRepository(BaseRepository[ReferenceJD]):
    def __init__(self, db: AsyncSession):
        super().__init__(ReferenceJD, db)

    async def get_by_organization(
        self, organization_id: uuid.UUID
    ) -> Sequence[ReferenceJD]:
        """Get reference JDs by organization"""
        query = (
            select(ReferenceJD)
            .where(ReferenceJD.organization_id == organization_id)
            .order_by(ReferenceJD.created_at.desc())
        )
        result = await self.db.execute(query)
        return result.scalars().all()

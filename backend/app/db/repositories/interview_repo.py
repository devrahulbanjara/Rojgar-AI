import uuid
from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.current_datetime import get_datetime_tz, get_timedelta
from app.db.models.application import JobApplication
from app.db.models.interview import Interview
from app.db.models.job import JobPosting
from app.db.repositories.base import BaseRepository


class InterviewRepository(BaseRepository[Interview]):
    def __init__(self, db: AsyncSession):
        super().__init__(Interview, db)

    async def get_by_organization(
        self,
        organization_id: uuid.UUID,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        job_id: uuid.UUID | None = None,
    ) -> Sequence[Interview]:
        """Get interviews for an organization, with optional filters."""
        query = (
            select(Interview)
            .join(
                JobApplication,
                Interview.application_id == JobApplication.application_id,
            )
            .join(JobPosting, JobApplication.job_id == JobPosting.job_id)
            .where(JobPosting.organization_id == organization_id)
        )

        if start_date:
            query = query.where(Interview.start_time >= start_date)
        if end_date:
            query = query.where(Interview.end_time <= end_date)
        if job_id:
            query = query.where(JobApplication.job_id == job_id)

        query = query.order_by(Interview.start_time.asc())
        result = await self.db.execute(query)
        return result.scalars().all()

    async def count_this_week(self, organization_id: uuid.UUID) -> int:
        """Count interviews scheduled this week for an organization."""
        now = get_datetime_tz()
        # Start of this week (Monday)
        start_of_week = now - get_timedelta(days=now.weekday())
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_week = start_of_week + get_timedelta(days=7)

        query = (
            select(func.count())
            .select_from(Interview)
            .join(
                JobApplication,
                Interview.application_id == JobApplication.application_id,
            )
            .join(JobPosting, JobApplication.job_id == JobPosting.job_id)
            .where(
                JobPosting.organization_id == organization_id,
                Interview.start_time >= start_of_week,
                Interview.start_time < end_of_week,
                Interview.status == "scheduled",
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one()

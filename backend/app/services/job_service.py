import uuid
from datetime import date

from app.core import get_datetime
from app.core.authorization import verify_user_can_edit_job
from app.db.models.job import JobDescription, JobPosting
from app.db.repositories.candidate_repo import CandidateProfileRepository
from app.db.repositories.job_repo import JobDescriptionRepository, JobRepository
from app.db.repositories.user_repo import UserRepository
from app.integrations.qdrant.vector_service import JobVectorService
from app.services.recruiter.activity_events import ActivityEventEmitter

VISIBLE_STATUSES = ["active"]


class JobService:
    def __init__(
        self,
        job_repo: JobRepository,
        job_description_repo: JobDescriptionRepository,
        candidate_profile_repo: CandidateProfileRepository,
        user_repo: UserRepository,
        vector_service: JobVectorService,
        activity_emitter: ActivityEventEmitter,
    ):
        self.job_repo = job_repo
        self.job_description_repo = job_description_repo
        self.candidate_profile_repo = candidate_profile_repo
        self.user_repo = user_repo
        self.vector_service = vector_service
        self.activity_emitter = activity_emitter

    async def get_recommendations(
        self,
        user_id: uuid.UUID,
        page: int = 1,
        limit: int = 10,
        employment_type: str | None = None,
        location_type: str | None = None,
    ):
        candidate = await self.candidate_profile_repo.get_with_skills(user_id)
        user_skills = []
        if candidate and candidate.skills:
            user_skills = [s.skill_name for s in candidate.skills]

        job_ids = None
        order_by_date = True
        if user_skills:
            try:
                raw_ids = await self.vector_service.recommend_jobs_by_skills(
                    user_skills, limit=1000
                )
                if raw_ids:
                    job_ids = raw_ids
                    order_by_date = False
            except Exception as e:
                from app.core.logging_config import logger

                logger.warning(f"Vector search failed for recommendations: {e}")
                job_ids = None
                order_by_date = True

        # Get paginated jobs using repository
        return await self.job_repo.get_visible_jobs_paginated(
            page=page,
            limit=limit,
            employment_type=employment_type,
            location_type=location_type,
            job_ids=job_ids,
            order_by_date=order_by_date,
        )

    async def search_jobs(
        self,
        query: str = "",
        page: int = 1,
        limit: int = 10,
        employment_type: str | None = None,
        location_type: str | None = None,
    ):
        # Get search results from vector service if query provided
        job_ids = None
        order_by_date = True
        if query.strip():
            raw_ids = await self.vector_service.search_jobs(query, limit=1000)
            if raw_ids:
                job_ids = raw_ids
                order_by_date = False

        # Get paginated jobs using repository
        return await self.job_repo.get_visible_jobs_paginated(
            page=page,
            limit=limit,
            employment_type=employment_type,
            location_type=location_type,
            job_ids=job_ids,
            order_by_date=order_by_date,
        )

    async def create_job(
        self, job_data, user_id: uuid.UUID, organization_id: uuid.UUID
    ):
        # Create job description
        job_description_id = uuid.uuid4()
        job_description = JobDescription(
            job_description_id=job_description_id,
            job_summary=job_data.job_summary,
            job_responsibilities=job_data.job_responsibilities,
            required_qualifications=job_data.required_qualifications,
            preferred=job_data.preferred,
            compensation_and_benefits=job_data.compensation_and_benefits,
            created_at=get_datetime(),
            updated_at=get_datetime(),
        )
        await self.job_description_repo.create(job_description)

        # Create job posting
        job_id = uuid.uuid4()
        application_deadline = job_data.application_deadline
        job_status = job_data.status if job_data.status else "active"
        job_posting = self._build_job_posting(
            job_id,
            organization_id,
            user_id,
            job_description_id,
            job_data,
            job_status,
            application_deadline,
        )
        await self.job_repo.create(job_posting)

        # Index job in vector service if active
        if job_status == "active":
            job_with_relations = await self.job_repo.get_with_details(job_id)
            if job_with_relations:
                await self.vector_service.index_job(
                    job_with_relations, self.job_repo.db
                )

        # Get final job with relations and user info
        job_posting_with_relations = await self.job_repo.get_with_details(job_id)
        recruiter_user = await self.user_repo.get(user_id)
        recruiter_name = recruiter_user.name if recruiter_user else None

        # Emit activity event
        if job_posting_with_relations:
            await self.activity_emitter.emit_job_created(
                organization_id=organization_id,
                recruiter_name=recruiter_name or "System",
                job_title=job_posting_with_relations.title,
                job_id=job_id,
                timestamp=job_posting_with_relations.created_at,
            )

        return job_posting_with_relations

    async def auto_expire_jobs(self) -> list[uuid.UUID]:
        """Auto-expire jobs and return IDs of jobs to shortlist"""
        # Get jobs that should be auto-shortlisted before expiring them
        jobs_to_auto_shortlist = await self.job_repo.get_jobs_to_auto_shortlist()

        # Expire all jobs past their deadline
        await self.job_repo.expire_jobs()

        return jobs_to_auto_shortlist

    async def get_jobs(
        self,
        user_id: uuid.UUID | None = None,
        organization_id: uuid.UUID | None = None,
        status: str | None = None,
        page: int = 1,
        limit: int = 10,
    ):
        """Get jobs with pagination and filters"""
        return await self.job_repo.get_jobs_paginated(
            user_id=user_id,
            organization_id=organization_id,
            status=status,
            page=page,
            limit=limit,
        )

    async def get_job_by_id(self, job_id: uuid.UUID):
        """Get job by ID with details"""
        return await self.job_repo.get_with_details(job_id)

    async def expire_job(self, job_id: uuid.UUID, user_id: uuid.UUID):
        """Expire a job if user has permission"""
        user = await self.user_repo.get(user_id)
        if not user:
            return None

        job_posting = await self.job_repo.get(job_id)
        if not job_posting:
            return None

        try:
            verify_user_can_edit_job(user, job_posting)
        except ValueError:
            return None

        await self.job_repo.expire_job(job_id)
        return await self.job_repo.get_with_details(job_id)

    async def delete_job(self, job_id: uuid.UUID, user_id: uuid.UUID):
        """Delete a job if user has permission"""
        user = await self.user_repo.get(user_id)
        if not user:
            return None

        job_posting = await self.job_repo.get(job_id)
        if not job_posting:
            return None

        try:
            verify_user_can_edit_job(user, job_posting)
        except ValueError:
            return None

        success = await self.job_repo.delete_job_cascade(job_id)
        return job_posting if success else None

    async def update_job(self, job_posting: JobPosting, job_data):
        """Update job posting and description"""
        updated_job = await self.job_repo.update_job_and_description(
            job_posting, job_data
        )

        # Index job if it becomes active and wasn't indexed before
        if job_data.status == "active" and (not job_posting.is_indexed):
            job_with_relations = await self.job_repo.get_with_details(
                job_posting.job_id
            )
            if job_with_relations:
                await self.vector_service.index_job(
                    job_with_relations, self.job_repo.db
                )

        return await self.job_repo.get_with_details(updated_job.job_id)

    def _build_job_posting(
        self,
        job_id: uuid.UUID,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        job_description_id: uuid.UUID,
        job_data,
        job_status: str,
        application_deadline,
    ):
        """Build job posting object"""
        return JobPosting(
            job_id=job_id,
            organization_id=organization_id,
            created_by_user_id=user_id,
            job_description_id=job_description_id,
            title=job_data.title,
            department=job_data.department,
            level=job_data.level,
            location_city=job_data.location_city,
            location_country=job_data.location_country,
            location_type=job_data.location_type,
            employment_type=job_data.employment_type,
            salary_min=job_data.salary_min,
            salary_max=job_data.salary_max,
            salary_currency=job_data.salary_currency,
            status=job_status,
            is_indexed=False,
            auto_shortlist=getattr(job_data, "auto_shortlist", False),
            posted_date=date.today(),
            application_deadline=application_deadline,
            created_at=get_datetime(),
            updated_at=get_datetime(),
        )

    def _empty_pagination_response(self, page: int, limit: int):
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

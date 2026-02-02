import math
import uuid
from datetime import date

from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session, selectinload

from app.core import NotFoundError, get_datetime
from app.core.authorization import verify_user_can_edit_job
from app.models import CandidateProfile, JobDescription, JobPosting, User
from app.services.candidate.vector_job_service import JobVectorService

VISIBLE_STATUSES = ["active"]


class JobService:
    _vector_service = JobVectorService()

    @staticmethod
    def get_recommendations(
        db: Session,
        user_id: uuid.UUID,
        page: int = 1,
        limit: int = 10,
        employment_type: str | None = None,
        location_type: str | None = None,
        saved_job_ids: set[uuid.UUID] | None = None,
    ):
        stmt = select(CandidateProfile).where(CandidateProfile.user_id == user_id)
        candidate = db.execute(stmt).scalar_one_or_none()
        user_skills = []
        if candidate and candidate.skills:
            user_skills = [s.skill_name for s in candidate.skills]
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
        if user_skills:
            raw_ids = JobService._vector_service.recommend_jobs_by_skills(
                user_skills, limit=1000
            )
            if raw_ids:
                base_stmt = base_stmt.where(JobPosting.job_id.in_(raw_ids))
        else:
            base_stmt = base_stmt.order_by(JobPosting.posted_date.desc())
        if employment_type:
            base_stmt = base_stmt.where(JobPosting.employment_type == employment_type)
        if location_type:
            base_stmt = base_stmt.where(JobPosting.location_type == location_type)
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = db.execute(count_stmt).scalar_one() or 0
        offset = (page - 1) * limit
        jobs_stmt = base_stmt.offset(offset).limit(limit)
        jobs = db.execute(jobs_stmt).scalars().all()
        total_pages = math.ceil(total / limit) if limit > 0 else 0
        paginated = {
            "jobs": jobs,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }
        if saved_job_ids:
            for job in paginated["jobs"]:
                job.is_saved = job.job_id in saved_job_ids
        return paginated

    @staticmethod
    def search_jobs(
        db: Session,
        query: str = "",
        page: int = 1,
        limit: int = 10,
        employment_type: str | None = None,
        location_type: str | None = None,
        saved_job_ids: set[uuid.UUID] | None = None,
    ):
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
        if query.strip():
            raw_ids = JobService._vector_service.search_jobs(query, limit=1000)
            if raw_ids:
                base_stmt = base_stmt.where(JobPosting.job_id.in_(raw_ids))
        else:
            base_stmt = base_stmt.order_by(JobPosting.posted_date.desc())
        if employment_type:
            base_stmt = base_stmt.where(JobPosting.employment_type == employment_type)
        if location_type:
            base_stmt = base_stmt.where(JobPosting.location_type == location_type)
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = db.execute(count_stmt).scalar_one() or 0
        offset = (page - 1) * limit
        jobs_stmt = base_stmt.offset(offset).limit(limit)
        jobs = db.execute(jobs_stmt).scalars().all()
        total_pages = math.ceil(total / limit) if limit > 0 else 0
        paginated = {
            "jobs": jobs,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }
        if saved_job_ids:
            for job in paginated["jobs"]:
                job.is_saved = job.job_id in saved_job_ids
        return paginated

    @staticmethod
    def create_job(
        db: Session, job_data, user_id: uuid.UUID, organization_id: uuid.UUID
    ):
        job_description_id = uuid.uuid4()
        job_id = uuid.uuid4()
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
        db.add(job_description)
        db.flush()
        application_deadline = job_data.application_deadline
        job_status = job_data.status if job_data.status else "active"
        job_posting = JobService._build_job_posting(
            job_id,
            organization_id,
            user_id,
            job_description_id,
            job_data,
            job_status,
            application_deadline,
        )
        db.add(job_posting)
        db.flush()
        if job_status == "active":
            stmt = (
                select(JobPosting)
                .options(
                    selectinload(JobPosting.job_description),
                    selectinload(JobPosting.organization),
                )
                .where(JobPosting.job_id == job_id)
            )
            job_with_relations = db.execute(stmt).scalar_one()
            JobService._vector_service.index_job(db, job_with_relations)
        db.commit()
        db.refresh(job_posting)
        recruiter_user = db.scalar(select(User).where(User.user_id == user_id))
        recruiter_name = recruiter_user.name if recruiter_user else None
        return (
            job_posting,
            {
                "organization_id": organization_id,
                "recruiter_name": recruiter_name,
                "job_title": job_posting.title,
                "job_id": job_id,
                "timestamp": job_posting.created_at,
            },
        )

    @staticmethod
    def auto_expire_jobs(db: Session):
        today = date.today()
        stmt = (
            update(JobPosting)
            .where(
                JobPosting.status == "active", JobPosting.application_deadline < today
            )
            .values(status="expired", updated_at=get_datetime())
        )
        result = db.execute(stmt)
        db.commit()
        return result.rowcount

    @staticmethod
    def get_jobs(
        db: Session,
        user_id: uuid.UUID | None = None,
        organization_id: uuid.UUID | None = None,
        status: str | None = None,
        page: int = 1,
        limit: int = 10,
    ):
        stmt = select(JobPosting)
        is_recruiter_view = False
        if user_id:
            is_recruiter_view = True
            user_stmt = select(User).where(User.user_id == user_id)
            user = db.execute(user_stmt).scalar_one_or_none()
            if user and user.organization_id:
                stmt = stmt.where(JobPosting.organization_id == user.organization_id)
            else:
                return JobService._empty_pagination_response(page, limit)
        elif organization_id:
            stmt = stmt.where(JobPosting.organization_id == organization_id)
        if status:
            stmt = stmt.where(JobPosting.status == status)
        elif not is_recruiter_view:
            stmt = stmt.where(JobPosting.status.in_(VISIBLE_STATUSES))
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = db.execute(count_stmt).scalar_one() or 0
        offset = (page - 1) * limit
        jobs_stmt = (
            stmt.options(
                selectinload(JobPosting.organization),
                selectinload(JobPosting.job_description),
            )
            .order_by(JobPosting.posted_date.desc())
            .offset(offset)
            .limit(limit)
        )
        jobs = db.execute(jobs_stmt).scalars().all()
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

    @staticmethod
    def get_job_by_id(
        db: Session, job_id: uuid.UUID, saved_job_ids: set[uuid.UUID] | None = None
    ):
        stmt = (
            select(JobPosting)
            .options(
                selectinload(JobPosting.organization),
                selectinload(JobPosting.job_description),
            )
            .where(JobPosting.job_id == job_id)
        )
        job = db.execute(stmt).scalar_one_or_none()
        if job and saved_job_ids:
            job.is_saved = job.job_id in saved_job_ids
        return job

    @staticmethod
    def expire_job(db: Session, job_id: uuid.UUID, user_id: uuid.UUID):
        user_stmt = select(User).where(User.user_id == user_id)
        user = db.execute(user_stmt).scalar_one_or_none()
        if not user:
            raise NotFoundError("User not found")
        job_stmt = select(JobPosting).where(JobPosting.job_id == job_id)
        job_posting = db.execute(job_stmt).scalar_one_or_none()
        if not job_posting:
            raise NotFoundError("Job not found")
        verify_user_can_edit_job(user, job_posting)
        job_posting.status = "expired"
        job_posting.updated_at = get_datetime()
        db.commit()
        db.refresh(job_posting)
        return job_posting

    @staticmethod
    def delete_job(db: Session, job_id: uuid.UUID, user_id: uuid.UUID):
        user_stmt = select(User).where(User.user_id == user_id)
        user = db.execute(user_stmt).scalar_one_or_none()
        if not user:
            raise NotFoundError("User not found")
        job_stmt = select(JobPosting).where(JobPosting.job_id == job_id)
        job_posting = db.execute(job_stmt).scalar_one_or_none()
        if not job_posting:
            raise NotFoundError("Job not found")
        verify_user_can_edit_job(user, job_posting)
        db.delete(job_posting)
        db.commit()

    @staticmethod
    def update_job(db: Session, job_posting: JobPosting, job_data):
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
        job_posting.updated_at = get_datetime()
        job_desc_stmt = select(JobDescription).where(
            JobDescription.job_description_id == job_posting.job_description_id
        )
        job_description = db.execute(job_desc_stmt).scalar_one_or_none()
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
        db.flush()
        if job_data.status == "active" and (not job_posting.is_indexed):
            stmt = (
                select(JobPosting)
                .options(
                    selectinload(JobPosting.job_description),
                    selectinload(JobPosting.organization),
                )
                .where(JobPosting.job_id == job_posting.job_id)
            )
            job_with_relations = db.execute(stmt).scalar_one()
            JobService._vector_service.index_job(db, job_with_relations)
        db.commit()
        db.refresh(job_posting)
        return job_posting

    @staticmethod
    def _build_job_posting(
        job_id: uuid.UUID,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        job_description_id: uuid.UUID,
        job_data,
        job_status: str,
        application_deadline,
    ):
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
            posted_date=date.today(),
            application_deadline=application_deadline,
            created_at=get_datetime(),
            updated_at=get_datetime(),
        )

    @staticmethod
    def _empty_pagination_response(page: int, limit: int):
        return {
            "jobs": [],
            "total": 0,
            "page": page,
            "limit": limit,
            "total_pages": 0,
            "has_next": False,
            "has_prev": False,
        }

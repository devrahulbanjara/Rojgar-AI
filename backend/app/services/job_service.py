import math
import uuid
from datetime import date, datetime

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core import get_datetime
from app.core.authorization import verify_user_can_edit_job
from app.models import (
    CandidateProfile,
    JobDescription,
    JobPosting,
    User,
)
from app.services.candidate.job_service_utils import get_latest_jobs
from app.services.candidate.vector_job_service import JobVectorService

VISIBLE_STATUSES = ["active"]


class JobService:
    _vector_service = JobVectorService()

    @staticmethod
    def get_recommendations(
        db: Session,
        user_id: str,
        page: int = 1,
        limit: int = 10,
        employment_type: str | None = None,
        location_type: str | None = None,
    ):
        stmt = select(CandidateProfile).where(CandidateProfile.user_id == user_id)
        candidate = db.execute(stmt).scalar_one_or_none()

        user_skills = []
        if candidate and candidate.skills:
            user_skills = [s.skill_name for s in candidate.skills]

        all_jobs = []
        today = date.today()
        if user_skills:
            raw_ids = JobService._vector_service.recommend_jobs_by_skills(
                user_skills, limit=200
            )
            if raw_ids:
                stmt = select(JobPosting).where(
                    JobPosting.job_id.in_(raw_ids),
                    JobPosting.status.in_(VISIBLE_STATUSES),
                    or_(
                        JobPosting.application_deadline.is_(None),
                        JobPosting.application_deadline >= today,
                    ),
                )
                jobs_from_db = db.execute(stmt).scalars().all()
                id_to_job = {job.job_id: job for job in jobs_from_db}
                all_jobs = [id_to_job[jid] for jid in raw_ids if jid in id_to_job]

        if not all_jobs:
            all_jobs = get_latest_jobs(db, limit=200)

        all_jobs = JobService._apply_filters(all_jobs, employment_type, location_type)

        return JobService._paginate_jobs(all_jobs, page, limit)

    @staticmethod
    def search_jobs(
        db: Session,
        query: str = "",
        page: int = 1,
        limit: int = 10,
        employment_type: str | None = None,
        location_type: str | None = None,
    ):
        all_jobs = []
        today = date.today()
        if query.strip():
            raw_ids = JobService._vector_service.search_jobs(query, limit=200)
            if raw_ids:
                stmt = (
                    select(JobPosting)
                    .options(
                        selectinload(JobPosting.organization),
                        selectinload(JobPosting.job_description),
                    )
                    .where(
                        JobPosting.job_id.in_(raw_ids),
                        JobPosting.status.in_(VISIBLE_STATUSES),
                        or_(
                            JobPosting.application_deadline.is_(None),
                            JobPosting.application_deadline >= today,
                        ),
                    )
                )
                jobs_from_db = db.execute(stmt).scalars().all()
                id_to_job = {job.job_id: job for job in jobs_from_db}
                all_jobs = [id_to_job[jid] for jid in raw_ids if jid in id_to_job]

        if not all_jobs:
            all_jobs = get_latest_jobs(db, limit=200)

        all_jobs = JobService._apply_filters(all_jobs, employment_type, location_type)

        return JobService._paginate_jobs(all_jobs, page, limit)

    @staticmethod
    def create_job(db: Session, job_data, user_id: str, organization_id: str):
        job_description_id = str(uuid.uuid4())
        job_id = str(uuid.uuid4())

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

        application_deadline = None
        if job_data.application_deadline:
            application_deadline = datetime.strptime(
                job_data.application_deadline, "%Y-%m-%d"
            ).date()
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

        return job_posting

    @staticmethod
    def get_jobs(
        db: Session,
        user_id: str | None = None,
        organization_id: str | None = None,
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
    def get_job_by_id(db: Session, job_id: str):
        stmt = select(JobPosting).where(JobPosting.job_id == job_id)
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def expire_job(db: Session, job_id: str, user_id: str):
        user_stmt = select(User).where(User.user_id == user_id)
        user = db.execute(user_stmt).scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        job_stmt = select(JobPosting).where(JobPosting.job_id == job_id)
        job_posting = db.execute(job_stmt).scalar_one_or_none()
        if not job_posting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        verify_user_can_edit_job(user, job_posting)

        job_posting.status = "expired"
        job_posting.updated_at = get_datetime()

        db.commit()
        db.refresh(job_posting)

        return job_posting

    @staticmethod
    def delete_job(db: Session, job_id: str, user_id: str):
        user_stmt = select(User).where(User.user_id == user_id)
        user = db.execute(user_stmt).scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        job_stmt = select(JobPosting).where(JobPosting.job_id == job_id)
        job_posting = db.execute(job_stmt).scalar_one_or_none()
        if not job_posting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

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
            job_posting.application_deadline = datetime.strptime(
                job_data.application_deadline, "%Y-%m-%d"
            ).date()

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

        if job_data.status == "active" and not job_posting.is_indexed:
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
    def _apply_filters(
        jobs: list, employment_type: str | None, location_type: str | None
    ):
        # Filter out expired jobs (application_deadline < today)
        today = date.today()
        jobs = [
            job
            for job in jobs
            if job.application_deadline is None or job.application_deadline >= today
        ]

        if employment_type:
            jobs = [job for job in jobs if job.employment_type == employment_type]
        if location_type:
            jobs = [job for job in jobs if job.location_type == location_type]
        return jobs

    @staticmethod
    def _paginate_jobs(all_jobs: list, page: int, limit: int):
        total = len(all_jobs)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_jobs = all_jobs[start_idx:end_idx]

        total_pages = math.ceil(total / limit) if limit > 0 else 0

        return {
            "jobs": paginated_jobs,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }

    @staticmethod
    def _build_job_posting(
        job_id: str,
        organization_id: str,
        user_id: str,
        job_description_id: str,
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


def build_location(city: str | None, country: str | None, location_type: str) -> str:
    parts = [p for p in [city, country] if p]
    return ", ".join(parts) if parts else location_type or "Not specified"


def extract_list_from_dict(data: dict | None, key: str) -> list:
    if not data or not isinstance(data, dict):
        return []
    value = data.get(key, [])
    return value if isinstance(value, list) else []


def _build_salary_range(job: JobPosting) -> dict | None:
    if not (job.salary_min or job.salary_max):
        return None

    return {
        "min": job.salary_min or 0,
        "max": job.salary_max or 0,
        "currency": job.salary_currency or "NPR",
    }


def _build_organization_data(job: JobPosting) -> dict | None:
    if not job.organization:
        return None

    org = job.organization
    return {
        "id": org.organization_id,
        "name": org.name,
        "description": org.description,
        "location_city": org.location_city,
        "location_country": org.location_country,
        "website": org.website,
        "industry": org.industry,
        "founded_year": org.founded_year,
    }


def map_job_to_response(job: JobPosting, saved_job_ids: set[str] | None = None):
    """Map a JobPosting to a response dictionary.

    Args:
        job: The JobPosting instance to map
        saved_job_ids: Optional set of job IDs that are saved by the current user.
                      If provided, adds an 'is_saved' field to the response.
    """
    location = build_location(
        job.location_city, job.location_country, job.location_type
    )

    job_data = {
        "job_id": job.job_id,
        "id": job.job_id,
        "organization_id": job.organization_id,
        "job_description_id": job.job_description_id,
        "title": job.title,
        "department": job.department,
        "level": job.level,
        "location": location,
        "location_city": job.location_city,
        "location_country": job.location_country,
        "is_remote": job.location_type == "Remote",
        "location_type": job.location_type,
        "employment_type": job.employment_type or "Full-time",
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "salary_currency": job.salary_currency or "NPR",
        "salary_range": _build_salary_range(job),
        "status": job.status,
        "posted_date": (job.posted_date.isoformat() if job.posted_date else None),
        "application_deadline": (
            job.application_deadline.isoformat() if job.application_deadline else None
        ),
        "created_at": (job.created_at.isoformat() if job.created_at else None),
        "updated_at": (job.updated_at.isoformat() if job.updated_at else None),
        "organization": _build_organization_data(job),
    }

    # Add is_saved field if saved_job_ids is provided
    if saved_job_ids is not None:
        job_data["is_saved"] = str(job.job_id) in saved_job_ids

    jd = job.job_description
    job_data.update(
        {
            "job_summary": jd.job_summary,
            "job_responsibilities": jd.job_responsibilities,
            "required_qualifications": jd.required_qualifications,
            "preferred": jd.preferred,
            "compensation_and_benefits": jd.compensation_and_benefits,
        }
    )

    return job_data

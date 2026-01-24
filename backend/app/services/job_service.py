import math
import uuid
from datetime import date, datetime

from fastapi import HTTPException, status
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
        candidate = (
            db.query(CandidateProfile)
            .filter(CandidateProfile.user_id == user_id)
            .first()
        )

        user_skills = []
        if candidate and candidate.skills:
            user_skills = [s.skill_name for s in candidate.skills]

        all_jobs = []
        if user_skills:
            raw_ids = JobService._vector_service.recommend_jobs_by_skills(
                user_skills, limit=200
            )
            if raw_ids:
                jobs_from_db = (
                    db.query(JobPosting)
                    .filter(
                        JobPosting.job_id.in_(raw_ids),
                        JobPosting.status.in_(VISIBLE_STATUSES),
                    )
                    .all()
                )
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
        if query.strip():
            raw_ids = JobService._vector_service.search_jobs(query, limit=200)
            if raw_ids:
                jobs_from_db = (
                    db.query(JobPosting)
                    .options(
                        selectinload(JobPosting.organization),
                        selectinload(JobPosting.job_description),
                    )
                    .filter(
                        JobPosting.job_id.in_(raw_ids),
                        JobPosting.status.in_(VISIBLE_STATUSES),
                    )
                    .all()
                )
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

        application_deadline = JobService._parse_application_deadline(
            job_data.application_deadline
        )
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
        query = db.query(JobPosting)
        is_recruiter_view = False

        if user_id:
            is_recruiter_view = True
            user = db.query(User).filter(User.user_id == user_id).first()
            if user and user.organization_id:
                query = query.filter(JobPosting.organization_id == user.organization_id)
            else:
                return JobService._empty_pagination_response(page, limit)
        elif organization_id:
            query = query.filter(JobPosting.organization_id == organization_id)

        if status:
            query = query.filter(JobPosting.status == status)
        elif not is_recruiter_view:
            query = query.filter(JobPosting.status.in_(VISIBLE_STATUSES))

        total = query.count()

        offset = (page - 1) * limit
        jobs = (
            query.options(
                selectinload(JobPosting.organization),
                selectinload(JobPosting.job_description),
            )
            .order_by(JobPosting.posted_date.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

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
        return db.query(JobPosting).filter(JobPosting.job_id == job_id).first()

    @staticmethod
    def expire_job(db: Session, job_id: str, user_id: str):
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        job_posting = db.query(JobPosting).filter(JobPosting.job_id == job_id).first()
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
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        job_posting = db.query(JobPosting).filter(JobPosting.job_id == job_id).first()
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
        if job_data.locationCity is not None:
            job_posting.location_city = job_data.locationCity
        if job_data.locationCountry is not None:
            job_posting.location_country = job_data.locationCountry
        if job_data.locationType is not None:
            job_posting.location_type = job_data.locationType
        if job_data.employmentType is not None:
            job_posting.employment_type = job_data.employmentType
        if job_data.salaryMin is not None:
            job_posting.salary_min = job_data.salaryMin
        if job_data.salaryMax is not None:
            job_posting.salary_max = job_data.salaryMax
        if job_data.currency is not None:
            job_posting.salary_currency = job_data.currency
        if job_data.status is not None:
            job_posting.status = job_data.status

        if job_data.applicationDeadline is not None:
            job_posting.application_deadline = JobService._parse_application_deadline(
                job_data.applicationDeadline
            )

        job_posting.updated_at = get_datetime()

        job_description = (
            db.query(JobDescription)
            .filter(JobDescription.job_description_id == job_posting.job_description_id)
            .first()
        )

        if job_description:
            if job_data.description is not None:
                job_description.role_overview = job_data.description

            if job_data.requiredSkillsAndExperience is not None:
                job_description.required_skills_experience = {
                    "required_skills_experience": job_data.requiredSkillsAndExperience
                }

            if job_data.niceToHave is not None:
                job_description.nice_to_have = (
                    {"nice_to_have": job_data.niceToHave}
                    if job_data.niceToHave
                    else None
                )

            if job_data.benefits is not None:
                job_description.offers = (
                    {"benefits": job_data.benefits} if job_data.benefits else None
                )

            job_description.updated_at = get_datetime()

        db.commit()
        db.refresh(job_posting)

        return job_posting

    @staticmethod
    def _apply_filters(
        jobs: list, employment_type: str | None, location_type: str | None
    ):
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
    def _parse_application_deadline(deadline_str: str | None):
        if not deadline_str:
            return None

        try:
            if "T" in deadline_str:
                return datetime.fromisoformat(
                    deadline_str.replace("Z", "+00:00")
                ).date()
            else:
                return datetime.strptime(deadline_str, "%Y-%m-%d").date()
        except Exception:
            return None

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
        "location": build_location(org.location_city, org.location_country, ""),
        "website": org.website,
        "industry": org.industry,
        "founded_year": org.founded_year,
    }


def _build_job_description_data(job: JobPosting) -> dict:
    jd = job.job_description

    role_overview = jd.role_overview if jd else None
    required_skills_exp_data = jd.required_skills_experience if jd else None
    requirements = extract_list_from_dict(
        required_skills_exp_data, "required_skills_experience"
    )
    benefits = extract_list_from_dict(jd.offers if jd else None, "benefits")
    nice_to_have = extract_list_from_dict(
        jd.nice_to_have if jd else None, "nice_to_have"
    )

    return {
        "role_overview": role_overview,
        "requirements": requirements,
        "benefits": benefits,
        "nice_to_have": nice_to_have,
    }


def _build_stats_data(job: JobPosting) -> dict:
    return {
        "applicant_count": 0,
        "views_count": 0,
        "is_featured": False,
    }


def map_job_to_response(job: JobPosting):
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

    job_data.update(_build_job_description_data(job))
    job_data.update(_build_stats_data(job))

    return job_data

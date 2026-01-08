import math
import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session, selectinload

from app.core import get_current_user_id, get_datetime, get_db
from app.core.limiter import limiter
from app.models import (
    CandidateProfile,
    JobDescription,
    JobPosting,
    JobPostingStats,
    User,
)
from app.schemas import job as schemas
from app.services.candidate.job_service_utils import get_latest_jobs
from app.services.candidate.vector_job_service import JobVectorService

router = APIRouter()
vector_service = JobVectorService()

VISIBLE_STATUSES = ["active"]


@router.get("/recommendations", response_model=schemas.JobListResponse)
@limiter.limit("5/minute")
def get_recommendations(
    request: Request,
    user_id: str,
    page: int = 1,
    limit: int = 10,
    employment_type: str | None = None,
    location_type: str | None = None,
    db: Session = Depends(get_db),
):
    """Get personalized job recommendations based on user skill or fallback to latest jobs if user skills is empty."""
    candidate = (
        db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    )

    user_skills = []
    if candidate and candidate.skills:
        user_skills = [s.skill_name for s in candidate.skills]

    all_jobs = []
    if user_skills:
        raw_ids = vector_service.recommend_jobs_by_skills(user_skills, limit=200)
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

    if employment_type:
        all_jobs = [job for job in all_jobs if job.employment_type == employment_type]
    if location_type:
        all_jobs = [job for job in all_jobs if job.location_type == location_type]

    total = len(all_jobs)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated_jobs = all_jobs[start_idx:end_idx]

    total_pages = math.ceil(total / limit) if limit > 0 else 0

    return {
        "jobs": [map_job_to_response(job) for job in paginated_jobs],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }


@router.get("/search", response_model=schemas.JobListResponse)
@limiter.limit("5/minute")
def search_jobs(
    request: Request,
    q: str = "",
    page: int = 1,
    limit: int = 10,
    employment_type: str | None = None,
    location_type: str | None = None,
    db: Session = Depends(get_db),
):
    all_jobs = []
    if q.strip():
        raw_ids = vector_service.search_jobs(q, limit=200)
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

    if employment_type:
        all_jobs = [job for job in all_jobs if job.employment_type == employment_type]
    if location_type:
        all_jobs = [job for job in all_jobs if job.location_type == location_type]

    total = len(all_jobs)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated_jobs = all_jobs[start_idx:end_idx]

    total_pages = math.ceil(total / limit) if limit > 0 else 0

    return {
        "jobs": [map_job_to_response(job) for job in paginated_jobs],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }


@router.post(
    "", response_model=schemas.JobResponse, status_code=status.HTTP_201_CREATED
)
@limiter.limit("5/minute")
def create_job(
    request: Request,
    job_data: schemas.JobCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    from app.core.authorization import get_organization_from_user

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    organization_id = get_organization_from_user(user)

    job_description_id = str(uuid.uuid4())
    job_id = str(uuid.uuid4())

    required_skills_list = (
        job_data.requiredSkillsAndExperience
        if job_data.requiredSkillsAndExperience
        else []
    )
    required_skills_experience_dict = {
        "required_skills_experience": required_skills_list
    }

    nice_to_have_dict = None
    if job_data.niceToHave:
        nice_to_have_dict = {"nice_to_have": job_data.niceToHave}

    offers_dict = None
    if job_data.benefits:
        offers_dict = {"benefits": job_data.benefits}

    job_description = JobDescription(
        job_description_id=job_description_id,
        role_overview=job_data.description or "",
        required_skills_experience=required_skills_experience_dict,
        nice_to_have=nice_to_have_dict,
        offers=offers_dict,
        created_at=get_datetime(),
        updated_at=get_datetime(),
    )

    db.add(job_description)
    db.flush()

    application_deadline = None
    if job_data.applicationDeadline:
        try:
            if "T" in job_data.applicationDeadline:
                application_deadline = datetime.fromisoformat(
                    job_data.applicationDeadline.replace("Z", "+00:00")
                ).date()
            else:
                application_deadline = datetime.strptime(
                    job_data.applicationDeadline, "%Y-%m-%d"
                ).date()
        except Exception:
            application_deadline = None

    job_status = job_data.status if job_data.status else "active"

    job_posting = JobPosting(
        job_id=job_id,
        organization_id=organization_id,
        created_by_user_id=user_id,
        job_description_id=job_description_id,
        title=job_data.title,
        department=job_data.department,
        level=job_data.level,
        location_city=job_data.locationCity,
        location_country=job_data.locationCountry,
        location_type=job_data.locationType,
        employment_type=job_data.employmentType,
        salary_min=job_data.salaryMin,
        salary_max=job_data.salaryMax,
        salary_currency=job_data.currency,
        status=job_status,
        is_indexed=False,
        posted_date=date.today(),
        application_deadline=application_deadline,
        created_at=get_datetime(),
        updated_at=get_datetime(),
    )

    db.add(job_posting)

    job_stats = JobPostingStats(
        job_stats_id=str(uuid.uuid4()),
        job_id=job_id,
        applicant_count=0,
        views_count=0,
        created_at=get_datetime(),
        updated_at=get_datetime(),
    )

    db.add(job_stats)

    db.commit()
    db.refresh(job_posting)

    return map_job_to_response(job_posting)


@router.get("", response_model=schemas.JobListResponse)
@limiter.limit("5/minute")
def get_jobs(
    request: Request,
    user_id: str | None = None,
    organization_id: str | None = None,
    status: str | None = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    query = db.query(JobPosting)
    is_recruiter_view = False

    if user_id:
        is_recruiter_view = True
        user = db.query(User).filter(User.user_id == user_id).first()
        if user and user.organization_id:
            query = query.filter(JobPosting.organization_id == user.organization_id)
        else:
            return {
                "jobs": [],
                "total": 0,
                "page": page,
                "limit": limit,
                "total_pages": 0,
                "has_next": False,
                "has_prev": False,
            }
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
            selectinload(JobPosting.company),
            selectinload(JobPosting.job_description),
            selectinload(JobPosting.stats),
        )
        .order_by(JobPosting.posted_date.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    items = [map_job_to_response(job) for job in jobs]
    total_pages = math.ceil(total / limit) if limit > 0 else 0

    return {
        "jobs": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }


@router.get("/{job_id}", response_model=schemas.JobResponse)
@limiter.limit("5/minute")
def get_job_detail(request: Request, job_id: str, db: Session = Depends(get_db)):
    job = db.query(JobPosting).filter(JobPosting.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return map_job_to_response(job)


def _build_location(city: str | None, country: str | None, location_type: str) -> str:
    parts = [p for p in [city, country] if p]
    return ", ".join(parts) if parts else location_type or "Not specified"


def _extract_list_from_dict(data: dict | None, key: str) -> list:
    if not data or not isinstance(data, dict):
        return []
    value = data.get(key, [])
    return value if isinstance(value, list) else []


def map_job_to_response(job: JobPosting):
    jd = job.job_description

    return {
        "job_id": job.job_id,
        "id": job.job_id,
        "organization_id": job.organization_id,
        "job_description_id": job.job_description_id,
        "title": job.title,
        "department": job.department,
        "level": job.level,
        "location": _build_location(
            job.location_city, job.location_country, job.location_type
        ),
        "location_city": job.location_city,
        "location_country": job.location_country,
        "is_remote": job.location_type == "Remote",
        "location_type": job.location_type,
        "employment_type": job.employment_type or "Full-time",
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "salary_currency": job.salary_currency or "NPR",
        "salary_range": {
            "min": job.salary_min or 0,
            "max": job.salary_max or 0,
            "currency": job.salary_currency or "NPR",
        }
        if (job.salary_min or job.salary_max)
        else None,
        "status": job.status,
        "posted_date": job.posted_date.isoformat() if job.posted_date else None,
        "application_deadline": job.application_deadline.isoformat()
        if job.application_deadline
        else None,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "updated_at": job.updated_at.isoformat() if job.updated_at else None,
        "organization": {
            "id": job.organization.organization_id,
            "name": job.organization.name,
            "description": job.organization.description,
            "location": _build_location(
                job.organization.location_city, job.organization.location_country, ""
            ),
            "website": job.organization.website,
            "industry": job.organization.industry,
            "founded_year": job.organization.founded_year,
        }
        if job.organization
        else None,
        "company_name": job.organization.name
        if job.organization
        else "Unknown Company",
        "description": jd.role_overview if jd else None,
        "role_overview": jd.role_overview if jd else None,
        "requirements": _extract_list_from_dict(
            jd.required_skills_experience if jd else None, "required_skills_experience"
        ),
        "benefits": _extract_list_from_dict(jd.offers if jd else None, "benefits"),
        "nice_to_have": _extract_list_from_dict(
            jd.nice_to_have if jd else None, "nice_to_have"
        ),
        "required_skills_experience": jd.required_skills_experience if jd else None,
        "applicant_count": job.stats.applicant_count if job.stats else 0,
        "views_count": job.stats.views_count if job.stats else 0,
        "is_featured": False,
    }

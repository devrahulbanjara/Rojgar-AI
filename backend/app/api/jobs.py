from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core import get_current_user_id, get_db
from app.core.limiter import limiter
from app.models import User
from app.schemas import job as schemas
from app.services.job_service import JobService, map_job_to_response

router = APIRouter()


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
    result = JobService.get_recommendations(
        db=db,
        user_id=user_id,
        page=page,
        limit=limit,
        employment_type=employment_type,
        location_type=location_type,
    )

    return {
        "jobs": [map_job_to_response(job) for job in result["jobs"]],
        "total": result["total"],
        "page": result["page"],
        "limit": result["limit"],
        "total_pages": result["total_pages"],
        "has_next": result["has_next"],
        "has_prev": result["has_prev"],
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
    result = JobService.search_jobs(
        db=db,
        query=q,
        page=page,
        limit=limit,
        employment_type=employment_type,
        location_type=location_type,
    )

    return {
        "jobs": [map_job_to_response(job) for job in result["jobs"]],
        "total": result["total"],
        "page": result["page"],
        "limit": result["limit"],
        "total_pages": result["total_pages"],
        "has_next": result["has_next"],
        "has_prev": result["has_prev"],
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

    job_posting = JobService.create_job(
        db=db,
        job_data=job_data,
        user_id=user_id,
        organization_id=organization_id,
    )

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
    result = JobService.get_jobs(
        db=db,
        user_id=user_id,
        organization_id=organization_id,
        status=status,
        page=page,
        limit=limit,
    )

    return {
        "jobs": [map_job_to_response(job) for job in result["jobs"]],
        "total": result["total"],
        "page": result["page"],
        "limit": result["limit"],
        "total_pages": result["total_pages"],
        "has_next": result["has_next"],
        "has_prev": result["has_prev"],
    }


@router.get("/{job_id}", response_model=schemas.JobResponse)
@limiter.limit("5/minute")
def get_job_detail(request: Request, job_id: str, db: Session = Depends(get_db)):
    job = JobService.get_job_by_id(db=db, job_id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return map_job_to_response(job)

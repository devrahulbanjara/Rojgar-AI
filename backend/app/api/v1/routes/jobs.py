"""
Job Routes – Browse, search, and fetch job listings and companies
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.job import JobResponse, CompanyResponse
from app.services.job_service import JobService

router = APIRouter()


# ===== Helpers =====

def _job_not_found(job_id: int):
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Job {job_id} not found",
    )


def _company_not_found(company_id: int):
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Company {company_id} not found",
    )


def _to_job_responses(jobs) -> List[JobResponse]:
    return [JobService.to_job_response(j) for j in jobs]


# ===== Main Job Listings =====

@router.get("/recommendations")
def get_recommended_jobs(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """Get recommended jobs for homepage (will use Qdrant vector DB in future)"""
    result = JobService.get_recommended_jobs(db=db, limit=limit)
    return {"success": True, "message": "Recommended jobs retrieved successfully", "data": result}


@router.get("/search")
def search_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    location: Optional[str] = None,
    department: Optional[str] = None,
    level: Optional[str] = None,
    location_type: Optional[str] = None,
    employment_type: Optional[str] = None,
    salary_min: Optional[int] = Query(None, ge=0),
    salary_max: Optional[int] = Query(None, ge=0),
    is_remote: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    company_id: Optional[int] = None,
    sort_by: str = Query("posted_date"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
):
    """Search and filter jobs with pagination"""
    result = JobService.search_jobs(
        db=db,
        page=page,
        limit=limit,
        search=search,
        location=location,
        department=department,
        level=level,
        location_type=location_type,
        employment_type=employment_type,
        salary_min=salary_min,
        salary_max=salary_max,
        is_remote=is_remote,
        is_featured=is_featured,
        company_id=company_id,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return {"success": True, "message": "Jobs retrieved successfully", "data": result}


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Get a job by ID"""
    job = JobService.get_job_by_id(job_id, db, increment_view=True)
    if not job:
        _job_not_found(job_id)
    return JobService.to_job_response(job)


# ===== Specific Job Lists =====

@router.get("/featured/list", response_model=List[JobResponse])
def get_featured_jobs(limit: int = Query(10, ge=1, le=50), db: Session = Depends(get_db)):
    """Get featured jobs"""
    return _to_job_responses(JobService.get_featured_jobs(db, limit))


@router.get("/recent/list", response_model=List[JobResponse])
def get_recent_jobs(limit: int = Query(10, ge=1, le=50), db: Session = Depends(get_db)):
    """Get recently posted jobs"""
    return _to_job_responses(JobService.get_recent_jobs(db, limit))


@router.get("/remote/list", response_model=List[JobResponse])
def get_remote_jobs(limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    """Get remote jobs"""
    return _to_job_responses(JobService.get_remote_jobs(db, limit))


@router.get("/skill/{skill}", response_model=List[JobResponse])
def get_jobs_by_skill(skill: str, limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    """Get jobs requiring a specific skill"""
    return _to_job_responses(JobService.get_jobs_by_skill(db, skill, limit))


@router.get("/location/{location}", response_model=List[JobResponse])
def get_jobs_by_location(location: str, limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    """Get jobs in a specific location"""
    return _to_job_responses(JobService.get_jobs_by_location(db, location, limit))


@router.get("/high-salary/list", response_model=List[JobResponse])
def get_high_salary_jobs(
    min_salary: int = Query(..., ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get jobs with salary above a threshold"""
    return _to_job_responses(JobService.get_high_salary_jobs(db, min_salary, limit))


# ===== Company Routes =====

@router.get("/companies/list", response_model=List[CompanyResponse])
def get_companies(db: Session = Depends(get_db)):
    """Get all companies"""
    companies = JobService.get_all_companies(db)
    return [JobService.to_company_response(c) for c in companies]


@router.get("/company/{company_id}", response_model=CompanyResponse)
def get_company(company_id: int, db: Session = Depends(get_db)):
    """Get a company by ID"""
    company = JobService.get_company_by_id(company_id, db)
    if not company:
        _company_not_found(company_id)
    return JobService.to_company_response(company)


@router.get("/company/{company_id}/jobs", response_model=List[JobResponse])
def get_company_jobs(company_id: int, db: Session = Depends(get_db)):
    """Get all jobs for a specific company"""
    return _to_job_responses(JobService.get_company_jobs(company_id, db))


@router.get("/company/{company_id}/info")
def get_company_info(company_id: int, db: Session = Depends(get_db)):
    """Get company details with jobs and statistics"""
    result = JobService.get_company_info_with_stats(company_id, db)
    if not result:
        _company_not_found(company_id)
    return result


# ===== Statistics =====

@router.get("/stats/overview")
def get_job_statistics(db: Session = Depends(get_db)):
    """Get overall job statistics"""
    return JobService.get_job_statistics(db)


# ===== Job Actions =====

@router.post("/{job_id}/view", status_code=status.HTTP_204_NO_CONTENT)
def increment_view(job_id: int, db: Session = Depends(get_db)):
    """Increment view count for a job"""
    if not JobService.increment_job_view(job_id, db):
        _job_not_found(job_id)


@router.post("/{job_id}/apply", status_code=status.HTTP_204_NO_CONTENT)
def increment_application(job_id: int, db: Session = Depends(get_db)):
    """Increment application count for a job"""
    if not JobService.increment_job_application(job_id, db):
        _job_not_found(job_id)
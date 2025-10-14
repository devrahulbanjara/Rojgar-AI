"""
Job routes - Browse and search jobs
Simple database queries for job listings
"""

from typing import List
from fastapi import APIRouter, HTTPException, status, Query, Depends
from sqlmodel import Session

from app.core.database import get_db
from app.models.job import (
    JobResponse,
    CompanyResponse,
)
from app.services.job_service import JobService

router = APIRouter()


# ============= Main Job Listings =============

@router.get("/")
def search_jobs(
    # Pagination
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    
    # Search
    search: str = Query(None),
    
    # Filters
    location: str = Query(None),
    department: str = Query(None),
    level: str = Query(None),
    location_type: str = Query(None),
    employment_type: str = Query(None),
    salary_min: int = Query(None, ge=0),
    salary_max: int = Query(None, ge=0),
    is_remote: bool = Query(None),
    is_featured: bool = Query(None),
    company_id: int = Query(None),
    
    # Sorting
    sort_by: str = Query("posted_date"),
    sort_order: str = Query("desc"),
    
    db: Session = Depends(get_db)
):
    """
    Search and filter jobs
    Returns paginated job listings with company info
    """
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
    
    return {
        "success": True,
        "message": "Jobs retrieved successfully",
        "data": result
    }


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Get a specific job by ID"""
    job = JobService.get_job_by_id(job_id, db, increment_view=True)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )
    
    return JobService.to_job_response(job)


# ============= Specific Job Lists =============

@router.get("/featured/list", response_model=List[JobResponse])
def get_featured_jobs(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get featured jobs"""
    jobs = JobService.get_featured_jobs(db, limit)
    return [JobService.to_job_response(job) for job in jobs]


@router.get("/recent/list", response_model=List[JobResponse])
def get_recent_jobs(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get recently posted jobs"""
    jobs = JobService.get_recent_jobs(db, limit)
    return [JobService.to_job_response(job) for job in jobs]


@router.get("/remote/list", response_model=List[JobResponse])
def get_remote_jobs(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get remote jobs"""
    jobs = JobService.get_remote_jobs(db, limit)
    return [JobService.to_job_response(job) for job in jobs]


@router.get("/skill/{skill}", response_model=List[JobResponse])
def get_jobs_by_skill(
    skill: str,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get jobs that require a specific skill"""
    jobs = JobService.get_jobs_by_skill(db, skill, limit)
    return [JobService.to_job_response(job) for job in jobs]


@router.get("/location/{location}", response_model=List[JobResponse])
def get_jobs_by_location(
    location: str,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get jobs in a specific location"""
    jobs = JobService.get_jobs_by_location(db, location, limit)
    return [JobService.to_job_response(job) for job in jobs]


@router.get("/high-salary/list", response_model=List[JobResponse])
def get_high_salary_jobs(
    min_salary: int = Query(..., ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get jobs with salary above minimum threshold"""
    jobs = JobService.get_high_salary_jobs(db, min_salary, limit)
    return [JobService.to_job_response(job) for job in jobs]


# ============= Company Routes =============

@router.get("/companies/list", response_model=List[CompanyResponse])
def get_companies(db: Session = Depends(get_db)):
    """Get all companies"""
    companies = JobService.get_all_companies(db)
    return [JobService.to_company_response(c) for c in companies]


@router.get("/company/{company_id}", response_model=CompanyResponse)
def get_company(company_id: int, db: Session = Depends(get_db)):
    """Get a specific company"""
    company = JobService.get_company_by_id(company_id, db)
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company {company_id} not found",
        )
    
    return JobService.to_company_response(company)


@router.get("/company/{company_id}/jobs", response_model=List[JobResponse])
def get_company_jobs(company_id: int, db: Session = Depends(get_db)):
    """Get all jobs for a specific company"""
    jobs = JobService.get_company_jobs(company_id, db)
    return [JobService.to_job_response(job) for job in jobs]


@router.get("/company/{company_id}/info")
def get_company_info(company_id: int, db: Session = Depends(get_db)):
    """Get company with jobs and statistics"""
    result = JobService.get_company_info_with_stats(company_id, db)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company {company_id} not found",
        )
    
    return result


# ============= Statistics =============

@router.get("/stats/overview")
def get_job_statistics(db: Session = Depends(get_db)):
    """Get overall job statistics"""
    return JobService.get_job_statistics(db)


# ============= Job Actions =============

@router.post("/{job_id}/view", status_code=status.HTTP_204_NO_CONTENT)
def increment_view(job_id: int, db: Session = Depends(get_db)):
    """Increment view count for a job"""
    success = JobService.increment_job_view(job_id, db)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )
    
    return None


@router.post("/{job_id}/apply", status_code=status.HTTP_204_NO_CONTENT)
def increment_application(job_id: int, db: Session = Depends(get_db)):
    """Increment application count for a job"""
    success = JobService.increment_job_application(job_id, db)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )
    
    return None

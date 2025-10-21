"""
Job Routes – Browse, search, and fetch job listings and companies
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.job import (
    JobResponse, 
    CompanyResponse, 
    JobSearchRequest, 
    JobRecommendationRequest,
    JobStatsResponse,
    JobSearchResponse,
    JobCreateRequest,
    JobUpdateRequest,
    CompanyCreateRequest,
    CompanyUpdateRequest
)
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


def _validate_job_id(job_id: int) -> int:
    """Validate job ID parameter"""
    if job_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job ID must be a positive integer"
        )
    return job_id


def _validate_company_id(company_id: int) -> int:
    """Validate company ID parameter"""
    if company_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company ID must be a positive integer"
        )
    return company_id


def _to_job_responses(jobs) -> List[JobResponse]:
    return [JobService.to_job_response(j) for j in jobs]


# ===== Main Job Listings =====

@router.get("/recommendations", response_model=List[JobResponse])
def get_recommended_jobs(
    rec_params: JobRecommendationRequest = Depends(),
    db: Session = Depends(get_db),
):
    """Get recommended jobs for homepage (will use Qdrant vector DB in future)"""
    result = JobService.get_recommended_jobs(db=db, limit=rec_params.limit)
    return result["jobs"]


@router.get("/search", response_model=JobSearchResponse)
def search_jobs(
    search_params: JobSearchRequest = Depends(),
    db: Session = Depends(get_db),
):
    """Search and filter jobs with pagination"""
    result = JobService.search_jobs(
        db=db,
        page=search_params.page,
        limit=search_params.limit,
        search=search_params.search,
        location=search_params.location,
        department=search_params.department,
        level=search_params.level,
        location_type=search_params.location_type,
        employment_type=search_params.employment_type,
        salary_min=search_params.salary_min,
        salary_max=search_params.salary_max,
        is_remote=search_params.is_remote,
        is_featured=search_params.is_featured,
        company_id=search_params.company_id,
        sort_by=search_params.sort_by,
        sort_order=search_params.sort_order,
    )
    return result


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: int = Depends(_validate_job_id), 
    db: Session = Depends(get_db)
):
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
def get_company(
    company_id: int = Depends(_validate_company_id), 
    db: Session = Depends(get_db)
):
    """Get a company by ID"""
    company = JobService.get_company_by_id(company_id, db)
    if not company:
        _company_not_found(company_id)
    return JobService.to_company_response(company)


@router.get("/company/{company_id}/jobs", response_model=List[JobResponse])
def get_company_jobs(
    company_id: int = Depends(_validate_company_id), 
    db: Session = Depends(get_db)
):
    """Get all jobs for a specific company"""
    return _to_job_responses(JobService.get_company_jobs(company_id, db))


@router.get("/company/{company_id}/info", response_model=dict)
def get_company_info(
    company_id: int = Depends(_validate_company_id), 
    db: Session = Depends(get_db)
):
    """Get company details with jobs and statistics"""
    result = JobService.get_company_info_with_stats(company_id, db)
    if not result:
        _company_not_found(company_id)
    return result


# ===== Statistics =====

@router.get("/stats/overview", response_model=JobStatsResponse)
def get_job_statistics(db: Session = Depends(get_db)):
    """Get overall job statistics"""
    return JobService.get_job_statistics(db)


# ===== Job Actions =====

@router.post("/{job_id}/view", status_code=status.HTTP_204_NO_CONTENT)
def increment_view(
    job_id: int = Depends(_validate_job_id), 
    db: Session = Depends(get_db)
):
    """Increment view count for a job"""
    if not JobService.increment_job_view(job_id, db):
        _job_not_found(job_id)


@router.post("/{job_id}/apply", status_code=status.HTTP_204_NO_CONTENT)
def increment_application(
    job_id: int = Depends(_validate_job_id), 
    db: Session = Depends(get_db)
):
    """Increment application count for a job"""
    if not JobService.increment_job_application(job_id, db):
        _job_not_found(job_id)


# ===== Job CRUD Operations =====

@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(job_data: JobCreateRequest, db: Session = Depends(get_db)):
    """Create a new job posting"""
    # This would need to be implemented in JobService
    # For now, return a placeholder response
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Job creation endpoint not yet implemented"
    )


@router.put("/{job_id}", response_model=JobResponse)
def update_job(job_id: int, job_data: JobUpdateRequest, db: Session = Depends(get_db)):
    """Update an existing job"""
    # This would need to be implemented in JobService
    # For now, return a placeholder response
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Job update endpoint not yet implemented"
    )


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(job_id: int, db: Session = Depends(get_db)):
    """Delete a job"""
    # This would need to be implemented in JobService
    # For now, return a placeholder response
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Job deletion endpoint not yet implemented"
    )


# ===== Company CRUD Operations =====

@router.post("/companies/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(company_data: CompanyCreateRequest, db: Session = Depends(get_db)):
    """Create a new company"""
    # This would need to be implemented in JobService
    # For now, return a placeholder response
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Company creation endpoint not yet implemented"
    )


@router.put("/companies/{company_id}", response_model=CompanyResponse)
def update_company(company_id: int, company_data: CompanyUpdateRequest, db: Session = Depends(get_db)):
    """Update an existing company"""
    # This would need to be implemented in JobService
    # For now, return a placeholder response
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Company update endpoint not yet implemented"
    )


@router.delete("/companies/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(company_id: int, db: Session = Depends(get_db)):
    """Delete a company"""
    # This would need to be implemented in JobService
    # For now, return a placeholder response
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Company deletion endpoint not yet implemented"
    )
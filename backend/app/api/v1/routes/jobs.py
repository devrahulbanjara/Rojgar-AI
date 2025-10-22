from typing import List
from fastapi import APIRouter, status, Query, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.job import (
    JobResponse,
    CompanyResponse,
    JobSearchRequest,
    JobStatsResponse,
    JobSearchResponse,
    JobCreateRequest,
)
from app.services.job_service import JobService
from app.api.v1.routes.dependencies import (
    _job_not_found,
    _company_not_found,
    _validate_job_id,
    _validate_company_id,
)

router = APIRouter()


@router.get("/recommendations", response_model=dict)
def get_personalized_job_recommendations(
    user_id: str = Query(..., description="User ID"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=50, description="Items per page"),
    db: Session = Depends(get_db),
):
    """Get personalized job recommendations based on user skills"""
    return JobService.get_personalized_job_recommendations(user_id, db, page, limit)


@router.get("/search", response_model=JobSearchResponse)
def search_jobs(
    search_params: JobSearchRequest = Depends(), db: Session = Depends(get_db)
):
    return JobService.search_jobs(db, search_params)


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int = Depends(_validate_job_id), db: Session = Depends(get_db)):
    """Get a job by ID"""
    job = JobService.get_job_by_id(job_id, db, increment_view=True)
    if not job:
        _job_not_found(job_id)
    return JobService.to_job_response(job)


@router.get("/recent/list", response_model=List[JobResponse])
def get_recent_jobs(limit: int = Query(10, ge=1, le=50), db: Session = Depends(get_db)):
    """Get recently posted jobs"""
    return [JobService.to_job_response(j) for j in JobService.get_recent_jobs(db, limit)]


@router.get("/companies/list", response_model=List[CompanyResponse])
def get_companies(db: Session = Depends(get_db)):
    companies = JobService.get_all_companies(db)
    return [JobService.to_company_response(c) for c in companies]


@router.get("/company/{company_id}", response_model=CompanyResponse)
def get_company(
    company_id: int = Depends(_validate_company_id), db: Session = Depends(get_db)
):
    company = JobService.get_company_by_id(company_id, db)
    if not company:
        _company_not_found(company_id)
    return JobService.to_company_response(company)


@router.get("/company/{company_id}/jobs", response_model=List[JobResponse])
def get_company_jobs(
    company_id: int = Depends(_validate_company_id), db: Session = Depends(get_db)
):
    jobs = JobService.get_company_jobs(company_id, db)
    return [JobService.to_job_response(job) for job in jobs]


@router.get("/company/{company_id}/info", response_model=dict)
def get_company_info(
    company_id: int = Depends(_validate_company_id), db: Session = Depends(get_db)
):
    result = JobService.get_company_info_with_stats(company_id, db)
    if not result:
        _company_not_found(company_id)
    return result


@router.get("/stats/overview", response_model=JobStatsResponse)
def get_job_statistics(db: Session = Depends(get_db)):
    return JobService.get_job_statistics(db)


@router.post("/{job_id}/view", status_code=status.HTTP_204_NO_CONTENT)
def increment_view(
    job_id: int = Depends(_validate_job_id), db: Session = Depends(get_db)
):
    if not JobService.increment_job_view(job_id, db):
        _job_not_found(job_id)


@router.post("/{job_id}/apply", status_code=status.HTTP_204_NO_CONTENT)
def increment_application(
    job_id: int = Depends(_validate_job_id), db: Session = Depends(get_db)
):
    if not JobService.increment_job_application(job_id, db):
        _job_not_found(job_id)

@router.post("/create", response_model=JobResponse)
def create_job(
    job_data: JobCreateRequest,
    db: Session = Depends(get_db)
):
    job = JobService.create_job_with_vector_sync(job_data.model_dump(), db)
    if not job:
        raise HTTPException(status_code=500, detail="Failed to create job")
    return JobService.to_job_response(job)


@router.get("/vector/search", response_model=List[dict])
def search_similar_jobs(
    query: str = Query(..., description="Search query"),
    limit: int = Query(5, ge=1, le=20, description="Number of results")
):
    return JobService.search_similar_jobs(query, limit)

from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.schemas import CompanyResponse, JobResponse, JobSearchRequest
from app.schemas.job import JobCreateRequest, JobSearchResponse, JobStatsResponse
from app.services import JobService

router = APIRouter()


@router.get("/recommendations", response_model=dict)
def get_personalized_job_recommendations(
    user_id: str = Query(..., description="User ID"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=50, description="Items per page"),
    job_service: JobService = Depends(),
):
    """Get personalized job recommendations based on user skills"""
    return job_service.get_personalized_job_recommendations(user_id, page, limit)


@router.get("/search", response_model=JobSearchResponse)
def search_jobs(
    search_params: JobSearchRequest = Depends(), job_service: JobService = Depends()
):
    return job_service.search_jobs(search_params)


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, job_service: JobService = Depends()):
    """Get a job by ID"""
    job = job_service.get_job_by_id(job_id, increment_view=True)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Job {job_id} not found"
        )
    return job_service.to_job_response(job)


@router.get("/recent/list", response_model=list[JobResponse])
def get_recent_jobs(
    limit: int = Query(10, ge=1, le=50), job_service: JobService = Depends()
):
    """Get recently posted jobs"""
    return [
        job_service.to_job_response(j) for j in job_service.get_recent_jobs(limit)
    ]


@router.get("/companies/list", response_model=list[CompanyResponse])
def get_companies(job_service: JobService = Depends()):
    companies = job_service.get_all_companies()
    return [job_service.to_company_response(c) for c in companies]


@router.get("/company/{company_id}", response_model=CompanyResponse)
def get_company(company_id: int, job_service: JobService = Depends()):
    company = job_service.get_company_by_id(company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company {company_id} not found",
        )
    return job_service.to_company_response(company)


@router.get("/company/{company_id}/jobs", response_model=list[JobResponse])
def get_company_jobs(company_id: int, job_service: JobService = Depends()):
    jobs = job_service.get_company_jobs(company_id)
    return [job_service.to_job_response(job) for job in jobs]


@router.get("/company/{company_id}/info", response_model=dict)
def get_company_info(company_id: int, job_service: JobService = Depends()):
    result = job_service.get_company_info_with_stats(company_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company {company_id} not found",
        )
    return result


@router.get("/stats/overview", response_model=JobStatsResponse)
def get_job_statistics(job_service: JobService = Depends()):
    return job_service.get_job_statistics()


@router.post("/{job_id}/view", status_code=status.HTTP_204_NO_CONTENT)
def increment_view(job_id: int, job_service: JobService = Depends()):
    if not job_service.increment_job_view(job_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Job {job_id} not found"
        )
    job_service.db.commit()


@router.post("/{job_id}/apply", status_code=status.HTTP_204_NO_CONTENT)
def increment_application(job_id: int, job_service: JobService = Depends()):
    if not job_service.increment_job_application(job_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Job {job_id} not found"
        )
    job_service.db.commit()


@router.post("/create", response_model=JobResponse)
def create_job(job_data: JobCreateRequest, job_service: JobService = Depends()):
    job = job_service.create_job_with_vector_sync(job_data.model_dump())
    if not job:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create job",
        )
    job_service.db.commit()
    return job_service.to_job_response(job)


@router.get("/vector/search", response_model=list[dict])
def search_similar_jobs(
    query: str = Query(..., description="Search query"),
    limit: int = Query(5, ge=1, le=20, description="Number of results"),
    job_service: JobService = Depends(),
):
    return job_service.search_similar_jobs(query, limit)

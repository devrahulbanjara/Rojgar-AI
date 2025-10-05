"""
Job API Routes
Clean, production-ready endpoints for job management
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query, Path
from fastapi.responses import JSONResponse

from app.schemas.job import (
    JobResponse,
    JobListResponse,
    JobSearchParams,
    JobStatsResponse,
    CompanySchema
)
from app.services.job_service import JobService

router = APIRouter()


@router.get("/", response_model=JobListResponse)
async def get_jobs(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search query"),
    location: Optional[str] = Query(None, description="Location filter"),
    department: Optional[str] = Query(None, description="Department filter"),
    level: Optional[str] = Query(None, description="Job level filter"),
    location_type: Optional[str] = Query(None, description="Location type filter"),
    employment_type: Optional[str] = Query(None, description="Employment type filter"),
    salary_min: Optional[int] = Query(None, ge=0, description="Minimum salary filter"),
    salary_max: Optional[int] = Query(None, ge=0, description="Maximum salary filter"),
    is_remote: Optional[bool] = Query(None, description="Remote work filter"),
    is_featured: Optional[bool] = Query(None, description="Featured jobs filter"),
    company_id: Optional[int] = Query(None, description="Company filter"),
    sort_by: str = Query("posted_date", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order (asc/desc)")
):
    """Get jobs with optional filtering and pagination"""
    try:
        # Create search parameters
        search_params = JobSearchParams(
            page=page,
            limit=limit,
            search=search,
            location=location,
            department=department,
            level=[level] if level else None,
            location_type=[location_type] if location_type else None,
            employment_type=[employment_type] if employment_type else None,
            salary_min=salary_min,
            salary_max=salary_max,
            is_remote=is_remote,
            is_featured=is_featured,
            company_id=company_id,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        # Search jobs
        jobs, total_count = JobService.search_jobs(search_params)
        
        # Enrich jobs with company data
        enriched_jobs = JobService.get_jobs_with_companies(jobs)
        
        # Calculate pagination info
        total_pages = (total_count + limit - 1) // limit
        has_next = page < total_pages
        has_prev = page > 1
        
        response_data = JobListResponse(
            jobs=enriched_jobs,
            total=total_count,
            page=page,
            total_pages=total_pages,
            has_next=has_next,
            has_prev=has_prev
        )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "message": "Jobs retrieved successfully",
                "data": response_data.dict()
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving jobs: {str(e)}"
        )


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: int = Path(..., description="Job ID")):
    """Get a specific job by ID"""
    try:
        job_data = JobService.get_job_with_company(job_id)
        if not job_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job with ID {job_id} not found"
            )
        
        # Increment view count
        JobService.increment_job_views(job_id)
        
        response_data = JobResponse(**job_data)
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "message": "Job retrieved successfully",
                "data": response_data.dict()
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving job: {str(e)}"
        )


@router.get("/featured/list", response_model=List[JobResponse])
async def get_featured_jobs(
    limit: int = Query(10, ge=1, le=50, description="Number of featured jobs to return")
):
    """Get featured jobs"""
    try:
        jobs = JobService.get_featured_jobs(limit)
        enriched_jobs = JobService.get_jobs_with_companies(jobs)
        
        response_data = [JobResponse(**job) for job in enriched_jobs]
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "message": "Featured jobs retrieved successfully",
                "data": response_data
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving featured jobs: {str(e)}"
        )


@router.get("/recent/list", response_model=List[JobResponse])
async def get_recent_jobs(
    limit: int = Query(10, ge=1, le=50, description="Number of recent jobs to return")
):
    """Get recently posted jobs"""
    try:
        jobs = JobService.get_recent_jobs(limit)
        enriched_jobs = JobService.get_jobs_with_companies(jobs)
        
        return [JobResponse(**job) for job in enriched_jobs]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving recent jobs: {str(e)}"
        )


@router.get("/remote/list", response_model=List[JobResponse])
async def get_remote_jobs(
    limit: int = Query(20, ge=1, le=100, description="Number of remote jobs to return")
):
    """Get remote jobs"""
    try:
        jobs = JobService.get_remote_jobs(limit)
        enriched_jobs = JobService.get_jobs_with_companies(jobs)
        
        return [JobResponse(**job) for job in enriched_jobs]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving remote jobs: {str(e)}"
        )


@router.get("/skill/{skill}", response_model=List[JobResponse])
async def get_jobs_by_skill(
    skill: str = Path(..., description="Skill name"),
    limit: int = Query(20, ge=1, le=100, description="Number of jobs to return")
):
    """Get jobs that require a specific skill"""
    try:
        jobs = JobService.get_jobs_by_skill(skill, limit)
        enriched_jobs = JobService.get_jobs_with_companies(jobs)
        
        return [JobResponse(**job) for job in enriched_jobs]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving jobs by skill: {str(e)}"
        )


@router.get("/location/{location}", response_model=List[JobResponse])
async def get_jobs_by_location(
    location: str = Path(..., description="Location name"),
    limit: int = Query(20, ge=1, le=100, description="Number of jobs to return")
):
    """Get jobs in a specific location"""
    try:
        jobs = JobService.get_jobs_by_location(location, limit)
        enriched_jobs = JobService.get_jobs_with_companies(jobs)
        
        return [JobResponse(**job) for job in enriched_jobs]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving jobs by location: {str(e)}"
        )


@router.get("/high-salary/list", response_model=List[JobResponse])
async def get_high_salary_jobs(
    min_salary: int = Query(..., ge=0, description="Minimum salary threshold"),
    limit: int = Query(20, ge=1, le=100, description="Number of jobs to return")
):
    """Get jobs with salary above minimum threshold"""
    try:
        jobs = JobService.get_high_salary_jobs(min_salary, limit)
        enriched_jobs = JobService.get_jobs_with_companies(jobs)
        
        return [JobResponse(**job) for job in enriched_jobs]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving high salary jobs: {str(e)}"
        )


@router.get("/company/{company_id}/jobs", response_model=List[JobResponse])
async def get_company_jobs(
    company_id: int = Path(..., description="Company ID")
):
    """Get all jobs for a specific company"""
    try:
        jobs = JobService.get_jobs_by_company(company_id)
        enriched_jobs = JobService.get_jobs_with_companies(jobs)
        
        return [JobResponse(**job) for job in enriched_jobs]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving company jobs: {str(e)}"
        )


@router.get("/company/{company_id}/info", response_model=dict)
async def get_company_info(
    company_id: int = Path(..., description="Company ID")
):
    """Get company information with jobs and statistics"""
    try:
        company_data = JobService.get_company_jobs_with_stats(company_id)
        if not company_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Company with ID {company_id} not found"
            )
        
        return company_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving company info: {str(e)}"
        )


@router.get("/companies/list", response_model=List[CompanySchema])
async def get_companies():
    """Get all companies"""
    try:
        companies = JobService.get_all_companies()
        return [CompanySchema(**company.to_dict()) for company in companies]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving companies: {str(e)}"
        )


@router.get("/company/{company_id}", response_model=CompanySchema)
async def get_company(
    company_id: int = Path(..., description="Company ID")
):
    """Get a specific company by ID"""
    try:
        company = JobService.get_company_by_id(company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Company with ID {company_id} not found"
            )
        
        return CompanySchema(**company.to_dict())
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving company: {str(e)}"
        )


@router.get("/stats/overview", response_model=JobStatsResponse)
async def get_job_statistics():
    """Get job statistics and overview"""
    try:
        stats = JobService.get_job_statistics()
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving job statistics: {str(e)}"
        )


@router.post("/{job_id}/view", status_code=status.HTTP_204_NO_CONTENT)
async def increment_job_view(job_id: int = Path(..., description="Job ID")):
    """Increment view count for a job"""
    try:
        if not JobService.validate_job_access(job_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job with ID {job_id} not found or not accessible"
            )
        
        success = JobService.increment_job_views(job_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to increment job view count"
            )
        
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content={})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error incrementing job view: {str(e)}"
        )


@router.post("/{job_id}/apply", status_code=status.HTTP_204_NO_CONTENT)
async def increment_job_application(job_id: int = Path(..., description="Job ID")):
    """Increment application count for a job"""
    try:
        if not JobService.validate_job_access(job_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job with ID {job_id} not found or not accessible"
            )
        
        success = JobService.increment_job_applications(job_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to increment job application count"
            )
        
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content={})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error incrementing job application: {str(e)}"
        )

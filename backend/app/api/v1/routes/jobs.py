"""
Job API Routes
Clean, production-ready endpoints for job management
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query, Path, Depends
from fastapi.responses import JSONResponse

from app.schemas.job import JobRead, CompanyRead, JobSearchParams
from app.services.job_service import JobService

router = APIRouter()


@router.get("/")
async def get_jobs(params: JobSearchParams = Depends()):
    """Get jobs with optional filtering and pagination using dependency injection"""
    try:
        # Convert params to search dictionary
        search_params = params.to_search_dict()
        
        # Search jobs with company relationship eagerly loaded
        jobs, total_count = JobService.search_jobs(search_params, with_company=True)
        
        # Convert to JobRead models (companies already loaded via relationship)
        enriched_jobs = JobService.get_jobs_with_companies(jobs)
        
        # Calculate pagination info
        total_pages = (total_count + params.limit - 1) // params.limit
        has_next = params.page < total_pages
        has_prev = params.page > 1
        
        return {
            "success": True,
            "message": "Jobs retrieved successfully",
            "data": {
                "jobs": enriched_jobs,
                "total": total_count,
                "page": params.page,
                "total_pages": total_pages,
                "has_next": has_next,
                "has_prev": has_prev
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving jobs: {str(e)}"
        )


@router.get("/{job_id}", response_model=JobRead)
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
        
        return job_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving job: {str(e)}"
        )


@router.get("/featured/list", response_model=List[JobRead])
async def get_featured_jobs(
    limit: int = Query(10, ge=1, le=50, description="Number of featured jobs to return")
):
    """Get featured jobs"""
    try:
        jobs = JobService.get_featured_jobs(limit)
        return JobService.get_jobs_with_companies(jobs)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving featured jobs: {str(e)}"
        )


@router.get("/recent/list", response_model=List[JobRead])
async def get_recent_jobs(
    limit: int = Query(10, ge=1, le=50, description="Number of recent jobs to return")
):
    """Get recently posted jobs"""
    try:
        jobs = JobService.get_recent_jobs(limit)
        return JobService.get_jobs_with_companies(jobs)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving recent jobs: {str(e)}"
        )


@router.get("/remote/list", response_model=List[JobRead])
async def get_remote_jobs(
    limit: int = Query(20, ge=1, le=100, description="Number of remote jobs to return")
):
    """Get remote jobs"""
    try:
        jobs = JobService.get_remote_jobs(limit)
        return JobService.get_jobs_with_companies(jobs)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving remote jobs: {str(e)}"
        )


@router.get("/skill/{skill}", response_model=List[JobRead])
async def get_jobs_by_skill(
    skill: str = Path(..., description="Skill name"),
    limit: int = Query(20, ge=1, le=100, description="Number of jobs to return")
):
    """Get jobs that require a specific skill"""
    try:
        jobs = JobService.get_jobs_by_skill(skill, limit)
        return JobService.get_jobs_with_companies(jobs)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving jobs by skill: {str(e)}"
        )


@router.get("/location/{location}", response_model=List[JobRead])
async def get_jobs_by_location(
    location: str = Path(..., description="Location name"),
    limit: int = Query(20, ge=1, le=100, description="Number of jobs to return")
):
    """Get jobs in a specific location"""
    try:
        jobs = JobService.get_jobs_by_location(location, limit)
        return JobService.get_jobs_with_companies(jobs)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving jobs by location: {str(e)}"
        )


@router.get("/high-salary/list", response_model=List[JobRead])
async def get_high_salary_jobs(
    min_salary: int = Query(..., ge=0, description="Minimum salary threshold"),
    limit: int = Query(20, ge=1, le=100, description="Number of jobs to return")
):
    """Get jobs with salary above minimum threshold"""
    try:
        jobs = JobService.get_high_salary_jobs(min_salary, limit)
        return JobService.get_jobs_with_companies(jobs)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving high salary jobs: {str(e)}"
        )


@router.get("/company/{company_id}/jobs", response_model=List[JobRead])
async def get_company_jobs(
    company_id: int = Path(..., description="Company ID")
):
    """Get all jobs for a specific company"""
    try:
        jobs = JobService.get_jobs_by_company(company_id)
        return JobService.get_jobs_with_companies(jobs)
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


@router.get("/companies/list", response_model=List[CompanyRead])
async def get_companies():
    """Get all companies"""
    try:
        companies = JobService.get_all_companies()
        return [CompanyRead.model_validate(company) for company in companies]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving companies: {str(e)}"
        )


@router.get("/company/{company_id}", response_model=CompanyRead)
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
        
        return CompanyRead.model_validate(company)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving company: {str(e)}"
        )


@router.get("/stats/overview")
async def get_job_statistics():
    """Get job statistics and overview"""
    try:
        return JobService.get_job_statistics()
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

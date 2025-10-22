from fastapi import HTTPException, status
from typing import List
from app.schemas.job import JobResponse
from app.services.job_service import JobService


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
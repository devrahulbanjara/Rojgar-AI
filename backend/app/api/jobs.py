from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import get_current_user_id, get_db
from app.core.authorization import get_organization_from_user
from app.core.limiter import limiter
from app.models import User
from app.schemas import job as schemas
from app.services.candidate.saved_job_service import SavedJobService
from app.services.job_service import JobService, map_job_to_response
from app.services.recruiter.reference_jd_service import ReferenceJDService

router = APIRouter()


@router.get("/recommendations", response_model=schemas.JobListResponse)
@limiter.limit("50/minute")
def get_recommendations(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    user_id: str,
    page: int = 1,
    limit: int = 10,
    employment_type: str | None = None,
    location_type: str | None = None,
):
    result = JobService.get_recommendations(
        db=db,
        user_id=user_id,
        page=page,
        limit=limit,
        employment_type=employment_type,
        location_type=location_type,
    )

    # Fetch saved job IDs for the user
    saved_job_ids = SavedJobService.get_saved_job_ids(db, user_id)

    return {
        "jobs": [
            map_job_to_response(job, saved_job_ids=saved_job_ids)
            for job in result["jobs"]
        ],
        "total": result["total"],
        "page": result["page"],
        "limit": result["limit"],
        "total_pages": result["total_pages"],
        "has_next": result["has_next"],
        "has_prev": result["has_prev"],
    }


@router.get("/search", response_model=schemas.JobListResponse)
@limiter.limit("50/minute")
def search_jobs(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    q: str = "",
    page: int = 1,
    limit: int = 10,
    employment_type: str | None = None,
    location_type: str | None = None,
    user_id: str | None = None,
):
    result = JobService.search_jobs(
        db=db,
        query=q,
        page=page,
        limit=limit,
        employment_type=employment_type,
        location_type=location_type,
    )

    # Fetch saved job IDs if user_id is provided
    saved_job_ids = None
    if user_id:
        saved_job_ids = SavedJobService.get_saved_job_ids(db, user_id)

    return {
        "jobs": [
            map_job_to_response(job, saved_job_ids=saved_job_ids)
            for job in result["jobs"]
        ],
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
@limiter.limit("50/minute")
def create_job(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    job_data: schemas.JobCreate,
    user_id: str = Depends(get_current_user_id),
):
    user_stmt = select(User).where(User.user_id == user_id)
    user = db.execute(user_stmt).scalar_one_or_none()
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
@limiter.limit("50/minute")
def get_jobs(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    user_id: str | None = None,
    organization_id: str | None = None,
    status: str | None = None,
    page: int = 1,
    limit: int = 10,
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


@router.post(
    "/reference-jd",
    response_model=schemas.ReferenceJDResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("50/minute")
def create_reference_jd(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    data: schemas.CreateReferenceJD,
    user_id: str = Depends(get_current_user_id),
):
    user_stmt = select(User).where(User.user_id == user_id)
    user = db.execute(user_stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    organization_id = get_organization_from_user(user)
    try:
        reference_jd, about_the_company = ReferenceJDService.create_reference_jd(
            db=db, organization_id=organization_id, data=data
        )

        return schemas.ReferenceJDResponse(
            id=reference_jd.referncejd_id,
            department=reference_jd.department,
            job_summary=reference_jd.job_summary,
            job_responsibilities=reference_jd.job_responsibilities,
            required_qualifications=reference_jd.required_qualifications,
            preferred=reference_jd.preferred,
            compensation_and_benefits=reference_jd.compensation_and_benefits,
            about_the_company=about_the_company,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/reference-jd", response_model=schemas.ReferenceJDListResponse)
@limiter.limit("50/minute")
def get_reference_jds(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    user_id: str = Depends(get_current_user_id),
):
    """Get all reference JDs for the authenticated user's organization"""
    user_stmt = select(User).where(User.user_id == user_id)
    user = db.execute(user_stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    organization_id = get_organization_from_user(user)

    try:
        reference_jds, about_the_company = ReferenceJDService.get_reference_jds(
            db=db, organization_id=organization_id
        )

        total = len(reference_jds)
        return schemas.ReferenceJDListResponse(
            reference_jds=[
                schemas.ReferenceJDResponse(
                    id=ref_jd.referncejd_id,
                    department=ref_jd.department,
                    job_summary=ref_jd.job_summary,
                    job_responsibilities=ref_jd.job_responsibilities,
                    required_qualifications=ref_jd.required_qualifications,
                    preferred=ref_jd.preferred,
                    compensation_and_benefits=ref_jd.compensation_and_benefits,
                    about_the_company=about_the_company,
                )
                for ref_jd in reference_jds
            ],
            total=total,
            page=1,
            limit=total if total > 0 else 1,
            total_pages=1,
            has_next=False,
            has_prev=False,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get(
    "/reference-jd/{reference_jd_id}", response_model=schemas.ReferenceJDResponse
)
@limiter.limit("50/minute")
def get_reference_jd_by_id(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    reference_jd_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Get a specific reference JD by ID"""
    user_stmt = select(User).where(User.user_id == user_id)
    user = db.execute(user_stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    organization_id = get_organization_from_user(user)

    try:
        reference_jd, about_the_company = ReferenceJDService.get_reference_jd_by_id(
            db=db, reference_jd_id=reference_jd_id, organization_id=organization_id
        )

        if not reference_jd:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reference JD not found",
            )

        return schemas.ReferenceJDResponse(
            id=reference_jd.referncejd_id,
            department=reference_jd.department,
            job_summary=reference_jd.job_summary,
            job_responsibilities=reference_jd.job_responsibilities,
            required_qualifications=reference_jd.required_qualifications,
            preferred=reference_jd.preferred,
            compensation_and_benefits=reference_jd.compensation_and_benefits,
            about_the_company=about_the_company,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.put(
    "/reference-jd/{reference_jd_id}",
    response_model=schemas.ReferenceJDResponse,
)
@limiter.limit("50/minute")
def update_reference_jd(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    reference_jd_id: str,
    data: schemas.CreateReferenceJD,
    user_id: str = Depends(get_current_user_id),
):
    """Update a reference JD"""
    user_stmt = select(User).where(User.user_id == user_id)
    user = db.execute(user_stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    organization_id = get_organization_from_user(user)

    try:
        reference_jd, about_the_company = ReferenceJDService.update_reference_jd(
            db=db,
            reference_jd_id=reference_jd_id,
            organization_id=organization_id,
            data=data,
        )

        return schemas.ReferenceJDResponse(
            id=reference_jd.referncejd_id,
            department=reference_jd.department,
            job_summary=reference_jd.job_summary,
            job_responsibilities=reference_jd.job_responsibilities,
            required_qualifications=reference_jd.required_qualifications,
            preferred=reference_jd.preferred,
            compensation_and_benefits=reference_jd.compensation_and_benefits,
            about_the_company=about_the_company,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update reference JD: {str(e)}",
        )


@router.delete(
    "/reference-jd/{reference_jd_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
@limiter.limit("50/minute")
def delete_reference_jd(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    reference_jd_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Delete a reference JD"""
    user_stmt = select(User).where(User.user_id == user_id)
    user = db.execute(user_stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    organization_id = get_organization_from_user(user)

    try:
        ReferenceJDService.delete_reference_jd(
            db=db,
            reference_jd_id=reference_jd_id,
            organization_id=organization_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete reference JD: {str(e)}",
        )


@router.get("/{job_id}", response_model=schemas.JobResponse)
@limiter.limit("50/minute")
def get_job_detail(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    job_id: str,
    user_id: str | None = None,
):
    job = JobService.get_job_by_id(db=db, job_id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Fetch saved job IDs if user_id is provided
    saved_job_ids = None
    if user_id:
        saved_job_ids = SavedJobService.get_saved_job_ids(db, user_id)

    return map_job_to_response(job, saved_job_ids=saved_job_ids)

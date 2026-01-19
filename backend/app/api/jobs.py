from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core import get_current_user_id, get_db
from app.core.authorization import get_organization_from_user
from app.core.limiter import limiter
from app.models import User
from app.schemas import job as schemas
from app.services.job_service import JobService, map_job_to_response
from app.services.recruiter.reference_jd_service import ReferenceJDService

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


@router.post("/reference-jd", response_model=schemas.ReferenceJDResponse)
@limiter.limit("5/minute")
def create_reference_jd(
    request: Request,
    data: schemas.CreateReferenceJD,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.user_id == user_id).first()
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
            role_overview=reference_jd.role_overview,
            requiredSkillsAndExperience=reference_jd.required_skills_experience,
            niceToHave=reference_jd.nice_to_have or [],
            benefits=reference_jd.offers or [],
            about_the_company=about_the_company,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/reference-jd", response_model=schemas.ReferenceJDListResponse)
@limiter.limit("5/minute")
def get_reference_jds(
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get all reference JDs for the authenticated user's organization"""
    user = db.query(User).filter(User.user_id == user_id).first()
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

        return schemas.ReferenceJDListResponse(
            reference_jds=[
                schemas.ReferenceJDResponse(
                    id=ref_jd.referncejd_id,
                    department=ref_jd.department,
                    role_overview=ref_jd.role_overview,
                    requiredSkillsAndExperience=ref_jd.required_skills_experience,
                    niceToHave=ref_jd.nice_to_have or [],
                    benefits=ref_jd.offers or [],
                    about_the_company=about_the_company,
                )
                for ref_jd in reference_jds
            ],
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get(
    "/reference-jd/{reference_jd_id}", response_model=schemas.ReferenceJDResponse
)
@limiter.limit("5/minute")
def get_reference_jd_by_id(
    request: Request,
    reference_jd_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get a specific reference JD by ID"""
    user = db.query(User).filter(User.user_id == user_id).first()
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
            role_overview=reference_jd.role_overview,
            requiredSkillsAndExperience=reference_jd.required_skills_experience,
            niceToHave=reference_jd.nice_to_have or [],
            benefits=reference_jd.offers or [],
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
@limiter.limit("5/minute")
def update_reference_jd(
    request: Request,
    reference_jd_id: str,
    data: schemas.CreateReferenceJD,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update a reference JD"""
    user = db.query(User).filter(User.user_id == user_id).first()
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
            role_overview=reference_jd.role_overview,
            requiredSkillsAndExperience=reference_jd.required_skills_experience,
            niceToHave=reference_jd.nice_to_have or [],
            benefits=reference_jd.offers or [],
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
@limiter.limit("5/minute")
def delete_reference_jd(
    request: Request,
    reference_jd_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete a reference JD"""
    user = db.query(User).filter(User.user_id == user_id).first()
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
@limiter.limit("5/minute")
def get_job_detail(request: Request, job_id: str, db: Session = Depends(get_db)):
    job = JobService.get_job_by_id(db=db, job_id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return map_job_to_response(job)

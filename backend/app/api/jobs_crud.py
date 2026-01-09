from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core import get_current_user_id, get_db
from app.core.authorization import get_organization_from_user, verify_user_can_edit_job
from app.core.limiter import limiter
from app.models import JobPosting, User
from app.schemas import job as schemas
from app.services.job_service import JobService, map_job_to_response
from app.services.recruiter.job_generation_service import JobGenerationService

router = APIRouter()


@router.post(
    "/generate-draft",
    response_model=schemas.JobDraftResponse,
    status_code=status.HTTP_200_OK,
)
@limiter.limit("10/minute")
def generate_job_draft(
    request: Request,
    draft_request: schemas.JobDraftGenerateRequest,
    user_id: str = Depends(get_current_user_id),
):
    if not draft_request.raw_requirements:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Raw requirements / some keywords are required",
        )

    try:
        combined_requirements = (
            f"{draft_request.title}. {draft_request.raw_requirements}"
        )

        generated_draft = JobGenerationService.generate_job_draft(combined_requirements)

        return schemas.JobDraftResponse(
            title=generated_draft.job_title,
            description=generated_draft.role_overview,
            requiredSkillsAndExperience=generated_draft.required_skills_and_experience,
            niceToHave=generated_draft.nice_to_have,
            benefits=generated_draft.what_company_offers,
            about_company=generated_draft.about_the_company,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate job description: {str(e)}",
        )


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


@router.put(
    "/{job_id}", response_model=schemas.JobResponse, status_code=status.HTTP_200_OK
)
@limiter.limit("5/minute")
def update_job(
    request: Request,
    job_id: str,
    job_data: schemas.JobUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    job_posting = db.query(JobPosting).filter(JobPosting.job_id == job_id).first()
    if not job_posting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    verify_user_can_edit_job(user, job_posting)

    updated_job = JobService.update_job(
        db=db,
        job_posting=job_posting,
        job_data=job_data,
    )

    return map_job_to_response(updated_job)

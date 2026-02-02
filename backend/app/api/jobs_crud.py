import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import BusinessLogicError, NotFoundError, get_current_active_user, get_db
from app.core.authorization import get_organization_from_user, verify_user_can_edit_job
from app.core.limiter import limiter
from app.models import JobPosting, User
from app.schemas import job as schemas
from app.services.job_service import JobService
from app.services.recruiter.activity_events import activity_emitter
from app.services.recruiter.job_generation_service import JobGenerationService

router = APIRouter()


@router.post(
    "/generate-draft",
    response_model=schemas.JobDraftResponse,
    status_code=status.HTTP_200_OK,
)
@limiter.limit("50/minute")
def generate_job_draft(
    request: Request,
    draft_request: schemas.JobDraftGenerateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    if not draft_request.raw_requirements:
        raise BusinessLogicError("Raw requirements / some keywords are required")
    organization_id = get_organization_from_user(current_user)
    generated_draft = JobGenerationService.generate_job_draft(
        title=draft_request.title,
        raw_requirements=draft_request.raw_requirements,
        db=db,
        reference_jd_id=draft_request.reference_jd_id,
        organization_id=organization_id,
        current_draft=draft_request.current_draft,
    )
    if not generated_draft or not generated_draft.get("draft"):
        raise BusinessLogicError("Failed to generate job description")
    draft = generated_draft["draft"]
    return draft


@router.post(
    "", response_model=schemas.JobResponse, status_code=status.HTTP_201_CREATED
)
@limiter.limit("50/minute")
def create_job(
    request: Request,
    background_tasks: BackgroundTasks,
    job_data: schemas.JobCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    organization_id = get_organization_from_user(current_user)
    job_posting, event_data = JobService.create_job(
        db=db,
        job_data=job_data,
        user_id=current_user.user_id,
        organization_id=organization_id,
    )
    background_tasks.add_task(
        activity_emitter.emit_job_created,
        organization_id=event_data["organization_id"],
        recruiter_name=event_data["recruiter_name"],
        job_title=event_data["job_title"],
        job_id=event_data["job_id"],
        timestamp=event_data["timestamp"],
    )
    return job_posting


@router.put(
    "/{job_id}", response_model=schemas.JobResponse, status_code=status.HTTP_200_OK
)
@limiter.limit("50/minute")
def update_job(
    request: Request,
    job_id: uuid.UUID,
    job_data: schemas.JobUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    job_stmt = select(JobPosting).where(JobPosting.job_id == job_id)
    job_posting = db.execute(job_stmt).scalar_one_or_none()
    if not job_posting:
        raise NotFoundError("Job not found")
    verify_user_can_edit_job(current_user, job_posting)
    updated_job = JobService.update_job(
        db=db, job_posting=job_posting, job_data=job_data
    )
    return updated_job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("50/minute")
def delete_job(
    request: Request,
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    JobService.delete_job(db=db, job_id=job_id, user_id=current_user.user_id)


@router.post(
    "/{job_id}/expire",
    response_model=schemas.JobResponse,
    status_code=status.HTTP_200_OK,
)
@limiter.limit("50/minute")
def expire_job(
    request: Request,
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    return JobService.expire_job(db=db, job_id=job_id, user_id=current_user.user_id)

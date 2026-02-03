import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_current_active_user, get_db
from app.core.authorization import get_organization_from_user, verify_user_can_edit_job
from app.core.config import settings
from app.core.limiter import limiter
from app.models import JobPosting, User
from app.schemas import job as schemas
from app.services.job_service import JobService
from app.services.recruiter.activity_events import activity_emitter
from app.services.recruiter.job_generation_service import JobGenerationService
from app.services.recruiter.shortlist_service import ShortlistService

router = APIRouter()


@router.post(
    "/generate-draft",
    response_model=schemas.JobDraftResponse,
    status_code=status.HTTP_200_OK,
)
@limiter.limit(settings.RATE_LIMIT_API)
async def generate_job_draft(
    request: Request,
    draft_request: schemas.JobDraftGenerateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if not draft_request.raw_requirements:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Raw requirements / some keywords are required"
        )
    organization_id = get_organization_from_user(current_user)
    if not organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not belong to any organization"
        )
    generated_draft = await JobGenerationService.generate_job_draft(
        title=draft_request.title,
        raw_requirements=draft_request.raw_requirements,
        db=db,
        reference_jd_id=draft_request.reference_jd_id,
        organization_id=organization_id,
        current_draft=draft_request.current_draft,
    )
    if not generated_draft or not generated_draft.get("draft"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to generate job description. Please check your requirements and try again."
        )
    draft = generated_draft["draft"]
    return draft


@router.post(
    "", response_model=schemas.JobResponse, status_code=status.HTTP_201_CREATED
)
@limiter.limit(settings.RATE_LIMIT_API)
async def create_job(
    request: Request,
    background_tasks: BackgroundTasks,
    job_data: schemas.JobCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    organization_id = get_organization_from_user(current_user)
    if not organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not belong to any organization"
        )
    job_posting, event_data = await JobService.create_job(
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
@limiter.limit(settings.RATE_LIMIT_API)
async def update_job(
    request: Request,
    job_id: uuid.UUID,
    job_data: schemas.JobUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    job_stmt = select(JobPosting).where(JobPosting.job_id == job_id)
    job_result = await db.execute(job_stmt)
    job_posting = job_result.scalar_one_or_none()
    if not job_posting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    try:
        verify_user_can_edit_job(current_user, job_posting)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    updated_job = await JobService.update_job(
        db=db, job_posting=job_posting, job_data=job_data
    )
    return updated_job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_job(
    request: Request,
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    job = await JobService.delete_job(
        db=db, job_id=job_id, user_id=current_user.user_id
    )
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )


@router.post(
    "/{job_id}/expire",
    response_model=schemas.JobResponse,
    status_code=status.HTTP_200_OK,
)
@limiter.limit(settings.RATE_LIMIT_API)
async def expire_job(
    request: Request,
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    job = await JobService.expire_job(
        db=db, job_id=job_id, user_id=current_user.user_id
    )
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    return job


@router.post("/{job_id}/shortlist", status_code=status.HTTP_200_OK)
@limiter.limit(settings.RATE_LIMIT_SHORTLIST_TRIGGER)
async def trigger_shortlisting(
    request: Request,
    job_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    job_result = await db.execute(select(JobPosting).where(JobPosting.job_id == job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    try:
        verify_user_can_edit_job(current_user, job)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )

    background_tasks.add_task(ShortlistService.process_shortlisting, job_id)

    return {"message": "AI scoring started in background", "job_id": str(job_id)}


@router.get("/{job_id}/shortlist/summary", status_code=status.HTTP_200_OK)
@limiter.limit(settings.RATE_LIMIT_SHORTLIST_SUMMARY)
async def get_shortlisting_summary(
    request: Request,
    job_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    job_result = await db.execute(select(JobPosting).where(JobPosting.job_id == job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    try:
        verify_user_can_edit_job(current_user, job)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )

    return await ShortlistService.get_shortlisting_summary(db, job_id)

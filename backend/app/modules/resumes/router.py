from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.auth.dependencies import require_candidate
from app.modules.auth.models import User
from app.modules.resumes import service
from app.modules.resumes.schemas import (
    ResumeCreate,
    ResumeListItem,
    ResumeResponse,
    ResumeUpdate,
)

router = APIRouter()

db = Depends(get_db)


@router.get(
    "/me",
    response_model=UnifiedResponse[list[ResumeListItem]],
    summary="List all resumes belonging to the authenticated candidate",
)
async def list_my_resumes(
    user: User = Depends(require_candidate),
    db: AsyncSession = db,
):
    data = await service.list_resumes(db, user)
    return ResponseBuilder.success(data=data, message="Resumes fetched.")


@router.post(
    "/",
    response_model=UnifiedResponse[ResumeResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Fork a new resume from the candidate's current profile",
)
async def create_resume(
    payload: ResumeCreate,
    user: User = Depends(require_candidate),
    db: AsyncSession = db,
):
    data = await service.fork_resume_from_profile(db, user, payload.resume_name)
    return ResponseBuilder.success(
        data=data,
        message="Resume created from profile.",
        status_code=status.HTTP_201_CREATED,
    )


@router.get(
    "/{resume_id}",
    response_model=UnifiedResponse[ResumeResponse],
    summary="Get a specific resume by ID",
)
async def get_resume(
    resume_id: str,
    user: User = Depends(require_candidate),
    db: AsyncSession = db,
):
    data = await service.get_resume(db, user, resume_id)
    return ResponseBuilder.success(data=data, message="Resume fetched.")


@router.put(
    "/{resume_id}",
    response_model=UnifiedResponse[ResumeResponse],
    summary="Update a resume's fields and/or child collections",
)
async def update_resume(
    resume_id: str,
    payload: ResumeUpdate,
    user: User = Depends(require_candidate),
    db: AsyncSession = db,
):
    data = await service.update_resume(db, user, resume_id, payload)
    return ResponseBuilder.success(data=data, message="Resume updated.")


@router.delete(
    "/{resume_id}",
    response_model=UnifiedResponse[None],
    summary="Delete a specific resume",
)
async def delete_resume(
    resume_id: str,
    user: User = Depends(require_candidate),
    db: AsyncSession = db,
):
    await service.delete_resume(db, user, resume_id)
    return ResponseBuilder.success(data=None, message="Resume deleted.")

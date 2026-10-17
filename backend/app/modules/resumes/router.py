from fastapi import APIRouter, status

from app.core.dependencies import CandidateUser, DbSession, UUIDPath
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.resumes import service
from app.modules.resumes.schemas import (
    ResumeCreate,
    ResumeListItem,
    ResumeResponse,
    ResumeUpdate,
)

router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.get(
    "/me",
    summary="List all resumes belonging to the authenticated candidate",
)
async def list_my_resumes(
    user: CandidateUser,
    db: DbSession,
) -> UnifiedResponse[list[ResumeListItem]]:
    """List resumes belonging to the authenticated candidate."""
    data = await service.list_resumes(db, user)
    return ResponseBuilder.success(data=data, message="Resumes fetched.")


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Create a new resume (optionally forked from the candidate's current profile)",
)
async def create_resume(
    payload: ResumeCreate,
    user: CandidateUser,
    db: DbSession,
) -> UnifiedResponse[ResumeResponse]:
    """Create a new resume, optionally pre-filled from the candidate profile."""
    data = await service.fork_resume_from_profile(
        db, user, payload.resume_name, payload.fork_from_profile
    )
    return ResponseBuilder.success(
        data=data,
        message="Resume created.",
        status_code=status.HTTP_201_CREATED,
    )


@router.get(
    "/{resume_id}",
    summary="Get a specific resume by ID",
)
async def get_resume(
    resume_id: UUIDPath,
    user: CandidateUser,
    db: DbSession,
) -> UnifiedResponse[ResumeResponse]:
    """Fetch one resume owned by the authenticated candidate."""
    data = await service.get_resume(db, user, resume_id)
    return ResponseBuilder.success(data=data, message="Resume fetched.")


@router.put(
    "/{resume_id}",
    summary="Update a resume's fields and/or child collections",
)
async def update_resume(
    resume_id: UUIDPath,
    payload: ResumeUpdate,
    user: CandidateUser,
    db: DbSession,
) -> UnifiedResponse[ResumeResponse]:
    """Update one resume owned by the authenticated candidate."""
    data = await service.update_resume(db, user, resume_id, payload)
    return ResponseBuilder.success(data=data, message="Resume updated.")


@router.delete(
    "/{resume_id}",
    summary="Delete a specific resume",
)
async def delete_resume(
    resume_id: UUIDPath,
    user: CandidateUser,
    db: DbSession,
) -> UnifiedResponse[None]:
    """Delete one resume owned by the authenticated candidate."""
    await service.delete_resume(db, user, resume_id)
    return ResponseBuilder.success(data=None, message="Resume deleted.")

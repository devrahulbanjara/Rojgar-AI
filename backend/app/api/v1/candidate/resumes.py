import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.dependencies import get_resume_service
from app.core import get_current_active_user
from app.db.models.user import User
from app.schemas import ResumeCreate, ResumeListResponse, ResumeResponse, ResumeUpdate
from app.services.candidate.resume_service import ResumeService

router = APIRouter()

limiter = Limiter(key_func=get_remote_address)


@router.get("/", response_model=list[ResumeListResponse])
async def list_resumes(
    current_user: User = Depends(get_current_active_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> list[ResumeListResponse]:
    """List all resumes for the current user."""
    return await resume_service.list_resumes(current_user)


@router.post("/", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def create_resume(
    data: ResumeCreate,
    current_user: User = Depends(get_current_active_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResumeResponse:
    """Create a new resume by forking from profile."""
    resume = await resume_service.create_resume_fork(current_user, data)
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found. Please create a profile first.",
        )
    return resume


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResumeResponse:
    """Get a specific resume by ID."""
    resume = await resume_service.get_resume(current_user, resume_id)
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )
    return resume


@router.patch("/{resume_id}", response_model=ResumeResponse)
async def sync_resume(
    resume_id: uuid.UUID,
    data: ResumeUpdate,
    current_user: User = Depends(get_current_active_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> ResumeResponse:
    """State-sync a resume: update scalars and replace nested collections."""
    resume = await resume_service.sync_resume(current_user, resume_id, data)
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )
    return resume


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> None:
    """Delete a resume."""
    resume = await resume_service.delete_resume(current_user, resume_id)
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )


@router.post("/upload", status_code=status.HTTP_200_OK)
async def upload_pdf_resume(
    file: UploadFile,
    current_user: User = Depends(get_current_active_user),
    resume_service: ResumeService = Depends(get_resume_service),
) -> dict:
    """Upload a PDF resume and parse it using AI into structured resume data."""
    if not file.content_type or "pdf" not in file.content_type.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted",
        )

    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be under 10MB",
        )

    result = await resume_service.parse_pdf_resume(file_bytes)
    return result

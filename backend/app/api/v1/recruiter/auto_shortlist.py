import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_job_service
from app.core import get_current_active_user
from app.db.models.user import User
from app.services.job_service import JobService

router = APIRouter()


@router.get("/{job_id}", status_code=status.HTTP_200_OK)
async def get_auto_shortlist(
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    job_service: Annotated[JobService, Depends(get_job_service)],
):
    """Get auto_shortlist value for a job"""
    try:
        status_val = await job_service.get_auto_shortlist_status(
            job_id, current_user.user_id
        )
        if status_val is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
            )
        return {"auto_shortlist": status_val}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.put("/{job_id}/toggle", status_code=status.HTTP_200_OK)
async def toggle_auto_shortlist(
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    job_service: Annotated[JobService, Depends(get_job_service)],
):
    """Toggle auto_shortlist value for a job"""
    try:
        new_status = await job_service.toggle_auto_shortlist(
            job_id, current_user.user_id
        )
        if new_status is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
            )
        return {"auto_shortlist": new_status}
    except ValueError as e:
        status_code = (
            status.HTTP_403_FORBIDDEN
            if "Only recruiters" in str(e)
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=status_code, detail=str(e))

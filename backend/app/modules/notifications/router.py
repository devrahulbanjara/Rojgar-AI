from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.notifications import service
from app.modules.notifications.schemas import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=UnifiedResponse[list[NotificationResponse]])
async def get_notifications(
    limit: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List notifications for the authenticated user."""
    data = await service.list_notifications(db, current_user, limit=limit)
    return ResponseBuilder.success(data=data, message="Notifications retrieved.")


@router.post(
    "/{notification_id}/read", response_model=UnifiedResponse[NotificationResponse]
)
async def read_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark one notification as read."""
    data = await service.mark_notification_read(db, current_user, notification_id)
    return ResponseBuilder.success(data=data, message="Notification marked as read.")


@router.post("/read-all", response_model=UnifiedResponse[dict])
async def read_all_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all notifications as read for the authenticated user."""
    updated = await service.mark_all_notifications_read(db, current_user)
    return ResponseBuilder.success(
        data={"updated": updated},
        message="Notifications marked as read.",
    )

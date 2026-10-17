from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from app.core.dependencies import CurrentUser, DbSession, UUIDPath
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.notifications import service
from app.modules.notifications.schemas import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
async def get_notifications(
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    current_user: CurrentUser = None,
    db: DbSession = None,
) -> UnifiedResponse[list[NotificationResponse]]:
    """List notifications for the authenticated user."""
    data = await service.list_notifications(db, current_user, limit=limit)
    return ResponseBuilder.success(data=data, message="Notifications retrieved.")


@router.post("/{notification_id}/read")
async def read_notification(
    notification_id: UUIDPath,
    current_user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[NotificationResponse]:
    """Mark one notification as read."""
    data = await service.mark_notification_read(db, current_user, notification_id)
    return ResponseBuilder.success(data=data, message="Notification marked as read.")


@router.post("/read-all")
async def read_all_notifications(
    current_user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[dict]:
    """Mark all notifications as read for the authenticated user."""
    updated = await service.mark_all_notifications_read(db, current_user)
    return ResponseBuilder.success(
        data={"updated": updated},
        message="Notifications marked as read.",
    )

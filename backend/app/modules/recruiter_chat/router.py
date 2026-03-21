import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.auth.dependencies import require_active_membership
from app.modules.auth.models import User
from app.modules.recruiter_chat import service
from app.modules.recruiter_chat.schemas import (
    ChatHistoryMessage,
    ChatSessionResponse,
)


router = APIRouter()
db_dep = Depends(get_db)


@router.post(
    "/sessions",
    response_model=UnifiedResponse[ChatSessionResponse],
    summary="Create a recruiter chat session",
)
async def create_recruiter_chat_session(
    user: User = Depends(require_active_membership),
    db: AsyncSession = db_dep,
):
    data = await service.create_session(db, user)
    return ResponseBuilder.success(data=data, message="Recruiter chat session created.")


@router.get(
    "/sessions/{session_id}/history",
    response_model=UnifiedResponse[list[ChatHistoryMessage]],
    summary="Get recruiter chat history",
)
async def get_recruiter_chat_history(
    session_id: uuid.UUID,
    user: User = Depends(require_active_membership),
    db: AsyncSession = db_dep,
):
    data = await service.get_history(db, user, session_id)
    return ResponseBuilder.success(data=data, message="Recruiter chat history fetched.")

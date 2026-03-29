import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.auth.dependencies import require_active_membership
from app.modules.auth.models import User
from app.modules.recruiter_chat import service
from app.modules.recruiter_chat.schemas import (
    ChatExchangeResponse,
    ChatHistoryMessage,
    ChatMessageRequest,
    ChatSessionResponse,
    RespondToInterruptRequest,
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
    "/sessions",
    response_model=UnifiedResponse[list[ChatSessionResponse]],
    summary="List recruiter chat sessions",
)
async def list_recruiter_chat_sessions(
    user: User = Depends(require_active_membership),
    db: AsyncSession = db_dep,
):
    data = await service.list_sessions(db, user)
    return ResponseBuilder.success(
        data=data, message="Recruiter chat sessions fetched."
    )


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


@router.post(
    "/sessions/{session_id}/messages",
    response_model=UnifiedResponse[ChatExchangeResponse],
    summary="Send a recruiter chat message",
)
async def send_recruiter_chat_message(
    session_id: uuid.UUID,
    payload: ChatMessageRequest,
    user: User = Depends(require_active_membership),
    db: AsyncSession = db_dep,
):
    data = await service.send_message(db, user, session_id, payload)
    return ResponseBuilder.success(data=data, message="Recruiter chat message sent.")


@router.post(
    "/sessions/{session_id}/messages/stream",
    summary="Stream a recruiter chat message response",
)
async def stream_recruiter_chat_message(
    session_id: uuid.UUID,
    payload: ChatMessageRequest,
    user: User = Depends(require_active_membership),
    db: AsyncSession = db_dep,
):
    stream = service.stream_message(db, user, session_id, payload)
    return StreamingResponse(
        stream,
        media_type="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
        },
    )


@router.post(
    "/sessions/{session_id}/interrupt",
    response_model=UnifiedResponse[ChatExchangeResponse],
    summary="Respond to recruiter chat review step",
)
async def respond_to_recruiter_chat_interrupt(
    session_id: uuid.UUID,
    payload: RespondToInterruptRequest,
    user: User = Depends(require_active_membership),
    db: AsyncSession = db_dep,
):
    data = await service.respond_to_interrupt(db, user, session_id, payload)
    return ResponseBuilder.success(
        data=data, message="Recruiter chat review response recorded."
    )


@router.delete(
    "/sessions/{session_id}",
    response_model=UnifiedResponse[None],
    summary="Delete a recruiter chat session",
)
async def delete_recruiter_chat_session(
    session_id: uuid.UUID,
    user: User = Depends(require_active_membership),
    db: AsyncSession = db_dep,
):
    await service.delete_session(db, user, session_id)
    return ResponseBuilder.success(data=None, message="Recruiter chat session deleted.")

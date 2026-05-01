import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from fastapi_limiter.depends import RateLimiter
from pyrate_limiter import Duration, Limiter, Rate

from app.core.dependencies import ActiveMember, DbSession
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.recruiter_chat import service
from app.modules.recruiter_chat.schemas import (
    ChatExchangeResponse,
    ChatHistoryResponse,
    ChatMessageRequest,
    ChatSessionResponse,
    ConfirmJobEditRequest,
    ConfirmJobSelectionRequest,
)


router = APIRouter(prefix="/recruiter-chat", tags=["recruiter-chat"])


@router.post(
    "/sessions",
    summary="Create a recruiter chat session",
    dependencies=[Depends(RateLimiter(limiter=Limiter(Rate(10, Duration.MINUTE * 5))))],
)
async def create_recruiter_chat_session(
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[ChatSessionResponse]:
    """Create a recruiter chat session."""
    data = await service.create_session(db, user)
    return ResponseBuilder.success(data=data, message="Recruiter chat session created.")


@router.get(
    "/sessions",
    summary="List recruiter chat sessions",
    dependencies=[Depends(RateLimiter(limiter=Limiter(Rate(30, Duration.MINUTE))))],
)
async def list_recruiter_chat_sessions(
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[list[ChatSessionResponse]]:
    """List recruiter chat sessions for the authenticated user."""
    data = await service.list_sessions(db, user)
    return ResponseBuilder.success(
        data=data, message="Recruiter chat sessions fetched."
    )


@router.get(
    "/sessions/{session_id}/history",
    summary="Get recruiter chat history",
    dependencies=[Depends(RateLimiter(limiter=Limiter(Rate(30, Duration.MINUTE))))],
)
async def get_recruiter_chat_history(
    session_id: uuid.UUID,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[ChatHistoryResponse]:
    """Fetch chat history for one recruiter chat session."""
    data = await service.get_history(db, user, session_id)
    return ResponseBuilder.success(data=data, message="Recruiter chat history fetched.")


@router.post(
    "/sessions/{session_id}/messages",
    summary="Send a recruiter chat message",
    dependencies=[Depends(RateLimiter(limiter=Limiter(Rate(20, Duration.MINUTE))))],
)
async def send_recruiter_chat_message(
    session_id: uuid.UUID,
    payload: ChatMessageRequest,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[ChatExchangeResponse]:
    """Send a recruiter chat message and return the assistant response."""
    data = await service.send_message(db, user, session_id, payload)
    return ResponseBuilder.success(data=data, message="Recruiter chat message sent.")


@router.post(
    "/sessions/{session_id}/messages/stream",
    summary="Stream a recruiter chat message response",
    dependencies=[Depends(RateLimiter(limiter=Limiter(Rate(20, Duration.MINUTE))))],
)
async def stream_recruiter_chat_message(
    session_id: uuid.UUID,
    payload: ChatMessageRequest,
    user: ActiveMember,
    db: DbSession,
):
    """Stream a recruiter chat response over SSE."""
    stream = service.stream_message(db, user, session_id, payload)
    return StreamingResponse(
        stream,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post(
    "/sessions/{session_id}/confirm-job-selection",
    summary="Confirm a specific job choice for recruiter chat",
    dependencies=[Depends(RateLimiter(limiter=Limiter(Rate(15, Duration.MINUTE))))],
)
async def confirm_recruiter_chat_job_selection(
    session_id: uuid.UUID,
    payload: ConfirmJobSelectionRequest,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[ChatExchangeResponse]:
    """Confirm a pending job selection inside recruiter chat."""
    data = await service.confirm_job_selection(db, user, session_id, payload)
    return ResponseBuilder.success(data=data, message="Job selection confirmed.")


@router.post(
    "/sessions/{session_id}/confirm-job-edit",
    summary="Approve or cancel the pending recruiter chat job edit",
    dependencies=[Depends(RateLimiter(limiter=Limiter(Rate(15, Duration.MINUTE))))],
)
async def confirm_recruiter_chat_job_edit(
    session_id: uuid.UUID,
    payload: ConfirmJobEditRequest,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[ChatExchangeResponse]:
    """Approve or cancel a pending job edit inside recruiter chat."""
    data = await service.confirm_job_edit(db, user, session_id, payload)
    return ResponseBuilder.success(data=data, message="Job edit decision recorded.")


@router.delete(
    "/sessions/{session_id}",
    summary="Delete a recruiter chat session",
    dependencies=[Depends(RateLimiter(limiter=Limiter(Rate(10, Duration.MINUTE * 5))))],
)
async def delete_recruiter_chat_session(
    session_id: uuid.UUID,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[None]:
    """Delete a recruiter chat session."""
    await service.delete_session(db, user, session_id)
    return ResponseBuilder.success(data=None, message="Recruiter chat session deleted.")

import uuid
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from fastapi_limiter.depends import RateLimiter
from pyrate_limiter import Duration, Limiter, Rate

from app.core.dependencies import ActiveMember, DbSession
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.core.security import decode_access_token
from app.modules.assistant import service
from app.modules.assistant.schemas import (
    CandidateHistory,
    CandidateTurnRequest,
    JobDraftHistory,
    JobDraftTurnRequest,
)

router = APIRouter(prefix="/assistant", tags=["assistant"])


async def rate_limit_key(request: Request) -> str:
    """Per user and route. X-Forwarded-For is client-controlled, so it is ignored."""
    auth = request.headers.get("Authorization", "")
    user_id = (
        decode_access_token(auth[7:]) if auth.lower().startswith("bearer ") else None
    )
    who = (
        f"user:{user_id}"
        if user_id
        else f"ip:{request.client.host if request.client else 'unknown'}"
    )
    return f"{who}:{request.scope['path']}"


def _limit(per_minute: int):
    limiter = RateLimiter(
        limiter=Limiter(Rate(per_minute, Duration.MINUTE)), identifier=rate_limit_key
    )
    return [Depends(limiter)]


def _sse(stream: AsyncIterator[str]) -> StreamingResponse:
    return StreamingResponse(
        stream,
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/job-draft", dependencies=_limit(20))
async def job_draft_turn(
    payload: JobDraftTurnRequest, user: ActiveMember, db: DbSession
) -> StreamingResponse:
    """SSE: `token` {text}* then `final` {draft_id, reply, follow_up, draft, sources}
    or `error` {code, message}."""
    return _sse(await service.job_draft_turn(db, user, payload))


@router.get("/job-draft/{draft_id}", dependencies=_limit(60))
async def job_draft_history(
    draft_id: uuid.UUID, user: ActiveMember, db: DbSession
) -> UnifiedResponse[JobDraftHistory]:
    data = await service.job_draft_history(db, user, draft_id)
    return ResponseBuilder.success(data=data, message="Draft fetched.")


@router.post("/candidates/{application_id}", dependencies=_limit(20))
async def candidate_turn(
    application_id: uuid.UUID,
    payload: CandidateTurnRequest,
    user: ActiveMember,
    db: DbSession,
) -> StreamingResponse:
    """SSE: `token` {text}* then `final` {answer, quotes, suggested_action,
    cv_available} or `error` {code, message}."""
    return _sse(await service.candidate_turn(db, user, application_id, payload))


@router.get("/candidates/{application_id}", dependencies=_limit(60))
async def candidate_history(
    application_id: uuid.UUID, user: ActiveMember, db: DbSession
) -> UnifiedResponse[CandidateHistory]:
    data = await service.candidate_history(db, user, application_id)
    return ResponseBuilder.success(data=data, message="History fetched.")

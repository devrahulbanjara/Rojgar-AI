from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from langchain_core.messages import HumanMessage, ToolMessage
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership
from app.modules.recruiter_chat.models import RecruiterChatSession
from app.modules.recruiter_chat.runtime import recruiter_chat_runtime
from app.modules.recruiter_chat.schemas import (
    ChatHistoryMessage,
    ChatSessionResponse,
)

logger = logging.getLogger(__name__)


def _new_thread_id() -> str:
    return f"recruiter-chat-{uuid.uuid4()}"


async def _get_active_company(db: AsyncSession, user_id: uuid.UUID) -> Company:
    result = await db.execute(
        select(Company)
        .join(CompanyMembership, CompanyMembership.company_id == Company.id)
        .where(
            CompanyMembership.user_id == user_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    company = result.scalar_one_or_none()
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active company membership required.",
        )
    return company


def _message_content_to_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and item.get("type") == "text":
                parts.append(str(item.get("text", "")))
        return "".join(parts).strip()
    return str(content or "").strip()


def _message_to_history_item(message: Any) -> ChatHistoryMessage:
    if isinstance(message, HumanMessage):
        return ChatHistoryMessage(
            role="user", content=_message_content_to_text(message.content)
        )
    if isinstance(message, ToolMessage):
        return ChatHistoryMessage(
            role="tool",
            content=_message_content_to_text(message.content),
            name=message.name,
        )
    return ChatHistoryMessage(
        role="assistant",
        content=_message_content_to_text(getattr(message, "content", "")),
    )


def _generate_session_title(message: str) -> str | None:
    normalized = " ".join(message.split()).strip()
    if not normalized:
        return None
    return normalized[:50].rstrip(" .,;:-")


async def create_session(db: AsyncSession, user: User) -> ChatSessionResponse:
    company = await _get_active_company(db, user.id)
    session = RecruiterChatSession(
        recruiter_id=user.id,
        company_id=company.id,
        thread_id=_new_thread_id(),
        last_interaction_at=datetime.now(timezone.utc),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return ChatSessionResponse.model_validate(session)


async def get_session(
    db: AsyncSession, user: User, session_id: uuid.UUID
) -> RecruiterChatSession:
    company = await _get_active_company(db, user.id)
    result = await db.execute(
        select(RecruiterChatSession).where(
            RecruiterChatSession.id == session_id,
            RecruiterChatSession.recruiter_id == user.id,
            RecruiterChatSession.company_id == company.id,
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recruiter chat session not found.",
        )
    return session


async def get_session_response(
    db: AsyncSession, user: User, session_id: uuid.UUID
) -> ChatSessionResponse:
    session = await get_session(db, user, session_id)
    return ChatSessionResponse.model_validate(session)


async def list_sessions(db: AsyncSession, user: User) -> list[ChatSessionResponse]:
    company = await _get_active_company(db, user.id)
    result = await db.execute(
        select(RecruiterChatSession)
        .where(
            RecruiterChatSession.recruiter_id == user.id,
            RecruiterChatSession.company_id == company.id,
        )
        .order_by(
            RecruiterChatSession.last_interaction_at.desc().nullslast(),
            RecruiterChatSession.created_at.desc(),
        )
    )
    sessions = result.scalars().all()
    return [ChatSessionResponse.model_validate(session) for session in sessions]


async def get_history(
    db: AsyncSession, user: User, session_id: uuid.UUID
) -> list[ChatHistoryMessage]:
    session = await get_session(db, user, session_id)
    graph = recruiter_chat_runtime.get_graph()
    snapshot = await graph.aget_state(
        {"configurable": {"thread_id": session.thread_id}}
    )
    messages = (
        snapshot.values.get("messages", []) if snapshot and snapshot.values else []
    )
    return [_message_to_history_item(message) for message in messages]


async def touch_session(
    db: AsyncSession, session: RecruiterChatSession, *, title: str | None = None
) -> None:
    session.last_interaction_at = datetime.now(timezone.utc)
    generated_title = _generate_session_title(title or "")
    if generated_title and not session.title:
        session.title = generated_title
    await db.commit()


async def delete_session(db: AsyncSession, user: User, session_id: uuid.UUID) -> None:
    session = await get_session(db, user, session_id)
    thread_id = session.thread_id
    await db.delete(session)
    await db.commit()

    try:
        await recruiter_chat_runtime.delete_thread(thread_id)
    except Exception:
        logger.exception(
            "Failed to delete recruiter chat checkpoints for thread %s", thread_id
        )

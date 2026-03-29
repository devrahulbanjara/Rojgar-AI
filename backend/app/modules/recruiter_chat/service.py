from __future__ import annotations

import json
import logging
import uuid
from collections.abc import AsyncIterator
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from langchain.messages import HumanMessage, ToolMessage
from langgraph.types import Command
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership
from app.modules.recruiter_chat.models import RecruiterChatSession
from app.modules.recruiter_chat.runtime import recruiter_chat_runtime
from app.modules.recruiter_chat.schemas import (
    AgentResponse,
    ChatExchangeResponse,
    ChatHistoryMessage,
    ChatMessageRequest,
    ChatSessionResponse,
    InterruptPayload,
    RespondToInterruptRequest,
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


async def _resolve_session_title_from_history(
    session: RecruiterChatSession,
) -> str | None:
    graph = recruiter_chat_runtime.get_graph()
    snapshot = await graph.aget_state(
        {"configurable": {"thread_id": session.thread_id}}
    )
    messages = (
        snapshot.values.get("messages", []) if snapshot and snapshot.values else []
    )

    for message in messages:
        if isinstance(message, HumanMessage):
            return _generate_session_title(_message_content_to_text(message.content))

    return None


async def _ensure_session_title(
    db: AsyncSession, session: RecruiterChatSession
) -> RecruiterChatSession:
    if session.title:
        return session

    derived_title = await _resolve_session_title_from_history(session)
    if not derived_title:
        return session

    session.title = derived_title
    await db.commit()
    await db.refresh(session)
    return session


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
    session = await _ensure_session_title(db, session)
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
    sessions = [await _ensure_session_title(db, session) for session in sessions]
    return [ChatSessionResponse.model_validate(session) for session in sessions]


async def get_history(
    db: AsyncSession, user: User, session_id: uuid.UUID
) -> list[ChatHistoryMessage]:
    session = await get_session(db, user, session_id)
    return await _get_history_for_session(session)


async def _get_history_for_session(
    session: RecruiterChatSession,
) -> list[ChatHistoryMessage]:
    graph = recruiter_chat_runtime.get_graph()
    snapshot = await graph.aget_state(
        {"configurable": {"thread_id": session.thread_id}}
    )
    messages = (
        snapshot.values.get("messages", []) if snapshot and snapshot.values else []
    )
    return [_message_to_history_item(message) for message in messages]


def _extract_interrupt_payload(result: dict[str, Any]) -> dict[str, Any] | None:
    interrupts = result.get("__interrupt__")

    if not interrupts:
        return None

    first = interrupts[0]
    value = getattr(first, "value", None)

    if value is not None:
        return value

    if isinstance(first, dict) and "value" in first:
        return first["value"]

    return None


def _stream_event_line(event: dict[str, Any]) -> str:
    return json.dumps(event, ensure_ascii=False) + "\n"


async def send_message(
    db: AsyncSession,
    user: User,
    session_id: uuid.UUID,
    payload: ChatMessageRequest,
) -> ChatExchangeResponse:
    session = await get_session(db, user, session_id)
    graph = recruiter_chat_runtime.get_graph()
    config = {"configurable": {"thread_id": session.thread_id}}
    state_input = {
        "messages": [HumanMessage(content=payload.message)],
        "company_id": str(session.company_id),
        "recruiter_id": str(session.recruiter_id),
        "thread_id": session.thread_id,
        "session_id": str(session.id),
    }

    result = await graph.ainvoke(state_input, config=config)
    interrupt_payload = _extract_interrupt_payload(result)
    await touch_session(db, session, title=payload.message)
    history = await _get_history_for_session(session)

    return ChatExchangeResponse(
        history=history,
        interrupt=InterruptPayload.model_validate(interrupt_payload)
        if interrupt_payload
        else None,
    )


async def stream_message(
    db: AsyncSession,
    user: User,
    session_id: uuid.UUID,
    payload: ChatMessageRequest,
) -> AsyncIterator[str]:
    session = await get_session(db, user, session_id)
    graph = recruiter_chat_runtime.get_graph()
    config = {"configurable": {"thread_id": session.thread_id}}
    state_input = {
        "messages": [HumanMessage(content=payload.message)],
        "company_id": str(session.company_id),
        "recruiter_id": str(session.recruiter_id),
        "thread_id": session.thread_id,
        "session_id": str(session.id),
    }

    yield _stream_event_line({"type": "thinking"})

    latest_values: dict[str, Any] | None = None
    started_stream = False
    emitted_tool_calls: set[str] = set()

    try:
        async for mode, chunk in graph.astream(
            state_input,
            config=config,
            stream_mode=["messages", "values"],
        ):
            if mode == "messages":
                message_chunk, metadata = chunk
                if metadata.get("langgraph_node") != "agent":
                    continue

                text = _message_content_to_text(getattr(message_chunk, "content", ""))
                if not text:
                    continue

                if not started_stream:
                    started_stream = True
                    yield _stream_event_line({"type": "message_start"})

                yield _stream_event_line({"type": "message_delta", "content": text})
                continue

            if mode == "values" and isinstance(chunk, dict):
                latest_values = chunk
                messages = chunk.get("messages", [])
                if messages:
                    last_message = messages[-1]
                    tool_calls = getattr(last_message, "tool_calls", []) or []
                    for tool_call in tool_calls:
                        tool_key = str(
                            tool_call.get("id")
                            or f"{tool_call.get('name')}:{tool_call.get('args')}"
                        )
                        if tool_key in emitted_tool_calls:
                            continue
                        emitted_tool_calls.add(tool_key)
                        yield _stream_event_line(
                            {
                                "type": "tool_call",
                                "tool": tool_call.get("name", "tool"),
                            }
                        )

        snapshot = await graph.aget_state(config)
        interrupt_payload = _extract_interrupt_payload(
            {"__interrupt__": snapshot.interrupts} if snapshot else latest_values or {}
        )
        await touch_session(db, session, title=payload.message)
        history = await _get_history_for_session(session)
        snapshot_values = snapshot.values if snapshot else latest_values or {}
        agent_response = snapshot_values.get("agent_response")
        structured_response = (
            AgentResponse.model_validate(agent_response)
            if isinstance(agent_response, dict)
            else None
        )
        web_sources: list[dict[str, Any]] = []
        all_messages = snapshot_values.get("messages", [])
        for message in all_messages:
            if not isinstance(message, ToolMessage) or message.name != "web_search":
                continue

            try:
                payload = (
                    json.loads(message.content)
                    if isinstance(message.content, str)
                    else {}
                )
            except json.JSONDecodeError:
                continue

            sources = (payload.get("data") or {}).get("sources", [])
            if isinstance(sources, list):
                web_sources.extend(
                    source
                    for source in sources
                    if isinstance(source, dict) and source.get("url")
                )
        response = ChatExchangeResponse(
            history=history,
            interrupt=InterruptPayload.model_validate(interrupt_payload)
            if interrupt_payload
            else None,
        )
        if web_sources:
            yield _stream_event_line({"type": "web_sources", "sources": web_sources})
        if (
            structured_response is not None
            and structured_response.ui_type != "text"
            and structured_response.data is not None
        ):
            yield _stream_event_line(
                {
                    "type": "structured_result",
                    "ui_type": structured_response.ui_type,
                    "data": structured_response.data,
                }
            )
        yield _stream_event_line(
            {"type": "final", "data": response.model_dump(mode="json")}
        )
    except Exception as exc:
        logger.exception("Recruiter chat streaming failed for session %s", session.id)
        yield _stream_event_line(
            {
                "type": "error",
                "message": str(exc) or "Recruiter chat request failed.",
            }
        )


async def respond_to_interrupt(
    db: AsyncSession,
    user: User,
    session_id: uuid.UUID,
    decision: RespondToInterruptRequest,
) -> ChatExchangeResponse:
    session = await get_session(db, user, session_id)
    graph = recruiter_chat_runtime.get_graph()
    config = {"configurable": {"thread_id": session.thread_id}}
    result = await graph.ainvoke(
        Command(resume=decision.model_dump(mode="json")),
        config=config,
    )
    interrupt_payload = _extract_interrupt_payload(result)
    await touch_session(db, session)
    history = await _get_history_for_session(session)

    return ChatExchangeResponse(
        history=history,
        interrupt=InterruptPayload.model_validate(interrupt_payload)
        if interrupt_payload
        else None,
    )


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

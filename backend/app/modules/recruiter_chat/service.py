from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
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
    ChatHistoryMessage,
    ChatSessionResponse,
    RespondToInterruptRequest,
)


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
        return ChatHistoryMessage(role="user", content=_message_content_to_text(message.content))
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


def _event_text_from_chunk(chunk: Any) -> str:
    content = getattr(chunk, "content", None)
    return _message_content_to_text(content)


def _interrupt_payload_from_snapshot(snapshot: Any) -> dict[str, Any] | None:
    for task in getattr(snapshot, "tasks", []) or []:
        interrupts = getattr(task, "interrupts", None) or []
        if not interrupts:
            continue
        interrupt = interrupts[0]
        value = getattr(interrupt, "value", None)
        if value is not None:
            return value
        if isinstance(interrupt, dict):
            return interrupt.get("value")
    return None


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


async def get_history(
    db: AsyncSession, user: User, session_id: uuid.UUID
) -> list[ChatHistoryMessage]:
    session = await get_session(db, user, session_id)
    graph = recruiter_chat_runtime.get_graph()
    snapshot = await graph.aget_state({"configurable": {"thread_id": session.thread_id}})
    messages = snapshot.values.get("messages", []) if snapshot and snapshot.values else []
    return [_message_to_history_item(message) for message in messages]


async def touch_session(
    db: AsyncSession, session: RecruiterChatSession, *, title: str | None = None
) -> None:
    session.last_interaction_at = datetime.now(timezone.utc)
    if title and not session.title:
        session.title = title[:255]
    await db.commit()


async def stream_response(
    db: AsyncSession,
    user: User,
    session_id: uuid.UUID,
    message: str,
):
    session = await get_session(db, user, session_id)
    company = await _get_active_company(db, user.id)
    await touch_session(db, session, title=message)

    graph = recruiter_chat_runtime.get_graph()
    config = {"configurable": {"thread_id": session.thread_id}}
    state_input = {
        "messages": [HumanMessage(content=message)],
        "recruiter_id": str(user.id),
        "company_id": str(company.id),
        "company_name": company.name,
        "session_id": str(session.id),
        "pending_edit": None,
        "human_decision": None,
        "edit_result": None,
        "agent_response": None,
    }

    async def generator():
        try:
            async for event in graph.astream_events(state_input, config=config, version="v2"):
                if event.get("event") == "on_chat_model_stream":
                    chunk_text = _event_text_from_chunk(event.get("data", {}).get("chunk"))
                    if chunk_text:
                        yield f"data: {json.dumps({'type': 'text_chunk', 'content': chunk_text})}\n\n"
                elif event.get("event") == "on_tool_end":
                    output = event.get("data", {}).get("output")
                    yield f"data: {json.dumps({'type': 'tool_result', 'tool': event.get('name'), 'data': output})}\n\n"

            snapshot = await graph.aget_state(config)
            interrupt_payload = _interrupt_payload_from_snapshot(snapshot)
            if interrupt_payload is not None:
                yield f"data: {json.dumps({'type': 'interrupt', 'data': interrupt_payload})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return generator()


async def respond_to_interrupt(
    db: AsyncSession,
    user: User,
    session_id: uuid.UUID,
    payload: RespondToInterruptRequest,
) -> AgentResponse:
    session = await get_session(db, user, session_id)
    await _get_active_company(db, user.id)
    await touch_session(db, session)

    graph = recruiter_chat_runtime.get_graph()
    config = {"configurable": {"thread_id": session.thread_id}}
    result = await graph.ainvoke(
        Command(
            resume={
                "action": payload.action,
                "patch_override": payload.patch_override,
            }
        ),
        config=config,
    )
    if "__interrupt__" in result:
        interrupt_value = result["__interrupt__"][0]
        value = getattr(interrupt_value, "value", None)
        if value is None and isinstance(interrupt_value, dict):
            value = interrupt_value.get("value")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Interrupt still pending: {value}",
        )

    snapshot = await graph.aget_state(config)
    response_payload = snapshot.values.get("agent_response")
    if response_payload is None:
        response_payload = result.get("agent_response")
    if response_payload is None:
        return AgentResponse(text="Done.", ui_type="text", data=None)
    return AgentResponse.model_validate(response_payload)

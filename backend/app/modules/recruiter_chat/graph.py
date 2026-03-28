from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Annotated, Any, Literal, TypedDict

from langchain_core.messages import (
    AIMessage,
    AnyMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_core.runnables import RunnableConfig
from langchain_groq import ChatGroq
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.types import interrupt
from loguru import logger

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.modules.companies.models import Company
from app.modules.recruiter_chat.models import RecruiterChatSession
from app.modules.recruiter_chat.prompts import RECRUITER_CHAT_SYSTEM_PROMPT
from app.modules.recruiter_chat.schemas import AgentResponse
from app.modules.recruiter_chat.tools import MODEL_TOOLS, _apply_job_edit_impl
from sqlalchemy import select


class RecruiterChatState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    active_messages: list[AnyMessage]
    recruiter_id: str
    company_id: str
    company_name: str
    thread_id: str
    session_id: str
    # Job edit flow
    pending_edit: dict[str, Any] | None
    # Clarification flows (new)
    pending_clarification: (
        dict[str, Any] | None
    )  # holds clarify_job_selection or clarify_candidate_selection data
    clarification_type: str | None  # "job" | "candidate"
    # Shared human-in-the-loop decision
    human_decision: dict[str, Any] | None
    edit_result: dict[str, Any] | None
    agent_response: dict[str, Any] | None


def _extract_text_content(content: Any) -> str:
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


def _parse_tool_payload(message: ToolMessage) -> dict[str, Any]:
    content = message.content
    if isinstance(content, str):
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"tool": message.name, "ok": False, "text": content, "data": None}
    if isinstance(content, list):
        joined = _extract_text_content(content)
        try:
            return json.loads(joined)
        except json.JSONDecodeError:
            return {"tool": message.name, "ok": False, "text": joined, "data": None}
    if isinstance(content, dict):
        return content
    return {"tool": message.name, "ok": False, "text": str(content), "data": None}


def _latest_tool_payloads(messages: list[AnyMessage]) -> list[dict[str, Any]]:
    if not messages:
        return []
    index = len(messages) - 1
    if isinstance(messages[index], AIMessage):
        index -= 1
    payloads: list[dict[str, Any]] = []
    while index >= 0 and isinstance(messages[index], ToolMessage):
        payloads.append(_parse_tool_payload(messages[index]))
        index -= 1
    payloads.reverse()
    return payloads


def _determine_ui_type(
    tool_payload: dict[str, Any] | None,
) -> Literal[
    "text",
    "candidate_list",
    "job_list",
    "salary_info",
    "candidate_detail",
    "job_edit_preview",
]:
    if not tool_payload or not tool_payload.get("ok"):
        return "text"
    hint = tool_payload.get("ui_type_hint")
    if hint in {
        "candidate_list",
        "job_list",
        "salary_info",
        "candidate_detail",
        "job_edit_preview",
        "text",
    }:
        return hint
    tool_name = tool_payload.get("tool")
    if tool_name == "search_company_candidates":
        return "candidate_list"
    if tool_name == "list_company_jobs":
        return "job_list"
    if tool_name == "research_salary":
        return "salary_info"
    if tool_name == "get_candidate_detail":
        return "candidate_detail"
    if tool_name == "prepare_job_edit":
        return "job_edit_preview"
    return "text"


def _normalize_human_decision(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            normalized = value.strip().lower()
            if normalized in {"confirm", "cancel", "reject"}:
                return {"action": normalized}
            return {}
        return parsed if isinstance(parsed, dict) else {}
    return {}


def _prune_active_messages(messages: list[AnyMessage]) -> list[AnyMessage]:
    system_messages = [m for m in messages if isinstance(m, SystemMessage)]
    conversational_indexes = [
        i for i, m in enumerate(messages) if isinstance(m, (HumanMessage, AIMessage))
    ]
    if len(conversational_indexes) <= 6:
        active_messages = [m for m in messages if not isinstance(m, SystemMessage)]
    else:
        first_kept_index = conversational_indexes[-6]
        active_messages = [
            m for m in messages[first_kept_index:] if not isinstance(m, SystemMessage)
        ]
    return [*system_messages, *active_messages]


async def _touch_session(session_id: str | None) -> None:
    if not session_id:
        return
    try:
        parsed_session_id = uuid.UUID(str(session_id))
    except ValueError:
        return
    async with AsyncSessionLocal() as db:
        session = await db.get(RecruiterChatSession, parsed_session_id)
        if session is None:
            return
        session.last_interaction_at = datetime.now(timezone.utc)
        await db.commit()


def build_recruiter_chat_graph():
    llm = ChatGroq(
        model=settings.groq_model_recruiter_chat,
        api_key=settings.groq_api_key,
        temperature=0,
    ).bind_tools(MODEL_TOOLS)

    # ------------------------------------------------------------------
    # Nodes
    # ------------------------------------------------------------------

    async def validate_context_node(
        state: RecruiterChatState, config: RunnableConfig
    ) -> dict[str, Any]:
        configurable_thread = config.get("configurable", {}).get("thread_id", "none")
        state_thread = state.get("thread_id", "none")
        logger.info(
            "configurable thread_id: {} | state thread_id: {}",
            configurable_thread,
            state_thread,
        )

        raw_session_id = state.get("session_id")
        raw_company_id = state.get("company_id")
        raw_recruiter_id = state.get("recruiter_id")

        if not raw_session_id or not raw_company_id or not raw_recruiter_id:
            raise ValueError("Recruiter chat context is incomplete.")

        try:
            session_id = uuid.UUID(str(raw_session_id))
            company_id = uuid.UUID(str(raw_company_id))
            recruiter_id = uuid.UUID(str(raw_recruiter_id))
        except ValueError as exc:
            raise ValueError("Recruiter chat context is invalid.") from exc

        if (
            state.get("company_name")
            and str(state.get("company_id")) == str(company_id)
            and str(state.get("recruiter_id")) == str(recruiter_id)
        ):
            return {}

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(RecruiterChatSession, Company.name)
                .join(Company, Company.id == RecruiterChatSession.company_id)
                .where(RecruiterChatSession.id == session_id)
            )
            row = result.one_or_none()

        if row is None:
            raise ValueError("Recruiter chat session not found.")

        session, company_name = row
        if session.company_id != company_id or session.recruiter_id != recruiter_id:
            raise ValueError(
                "Recruiter chat context does not match the active session."
            )

        return {
            "company_id": str(session.company_id),
            "recruiter_id": str(session.recruiter_id),
            "company_name": company_name,
        }

    async def prune_messages_node(state: RecruiterChatState) -> dict[str, Any]:
        active_messages = _prune_active_messages(state.get("messages", []))
        return {"active_messages": active_messages}

    async def agent_node(state: RecruiterChatState) -> dict[str, Any]:
        system_message = SystemMessage(
            content=RECRUITER_CHAT_SYSTEM_PROMPT.format(
                company_name=state["company_name"]
            )
        )
        active_messages = state.get("active_messages") or _prune_active_messages(
            state.get("messages", [])
        )
        response = await llm.ainvoke([system_message, *active_messages])
        return {"messages": [response], "agent_response": None, "edit_result": None}

    # -- Job edit flow --

    async def review_edit_node(state: RecruiterChatState) -> dict[str, Any]:
        payloads = _latest_tool_payloads(state["messages"])
        proposal_payload = payloads[-1]["data"] if payloads else None
        decision = interrupt({"type": "job_edit_preview", "proposal": proposal_payload})
        return {"pending_edit": proposal_payload, "human_decision": decision}

    async def apply_edit_node(state: RecruiterChatState) -> dict[str, Any]:
        proposal = state["pending_edit"] or {}
        decision = _normalize_human_decision(state.get("human_decision"))
        patch = {
            **(proposal.get("patch") or {}),
            **(decision.get("patch_override") or {}),
        }
        result = await _apply_job_edit_impl(
            job_id=proposal["job_id"],
            patch=patch,
            company_id=state["company_id"],
            recruiter_id=state["recruiter_id"],
        )
        return {
            "edit_result": result.model_dump(mode="json"),
            "pending_edit": None,
            "human_decision": None,
        }

    async def cancel_edit_node(state: RecruiterChatState) -> dict[str, Any]:
        response = AgentResponse(
            text="Okay, I cancelled that job edit.", ui_type="text", data=None
        )
        return {
            "agent_response": response.model_dump(mode="json"),
            "pending_edit": None,
            "human_decision": None,
            "edit_result": None,
        }

    # -- Clarification flow (NEW) --

    async def clarify_node(state: RecruiterChatState) -> dict[str, Any]:
        """
        Pause and ask the recruiter to confirm a job or candidate selection.
        The interrupt value is the full payload that the frontend renders as a
        'Did you mean X?' card. When the recruiter responds (Yes / No), the
        graph resumes here and the return value of interrupt() is the decision.
        """
        payloads = _latest_tool_payloads(state["messages"])
        last_payload = payloads[-1] if payloads else {}
        tool_name = last_payload.get("tool", "")
        clarify_data = last_payload.get("data") or {}

        if tool_name == "clarify_job_selection":
            interrupt_type = "job_clarification"
            clarification_type = "job"
        else:
            interrupt_type = "candidate_clarification"
            clarification_type = "candidate"

        # Map tool data keys to the InterruptPayload schema field name
        interrupt_key = (
            "job_clarification"
            if clarification_type == "job"
            else "candidate_clarification"
        )

        decision = interrupt(
            {
                "type": interrupt_type,
                interrupt_key: clarify_data,
            }
        )

        return {
            "pending_clarification": clarify_data,
            "clarification_type": clarification_type,
            "human_decision": decision,
        }

    async def resolve_clarification_node(state: RecruiterChatState) -> dict[str, Any]:
        """
        Process the recruiter's Yes / No response to a clarification.

        - confirm  → inject a system note so the agent knows the exact entity and
                     can continue the original intent (e.g. ask what to edit).
        - reject   → tell the agent the recruiter said no, so it can ask them
                     to pick from the full list or rephrase.
        """
        decision = _normalize_human_decision(state.get("human_decision"))
        action = decision.get("action", "reject")
        clarify = state.get("pending_clarification") or {}
        clarification_type = state.get("clarification_type", "job")

        if action == "confirm":
            if clarification_type == "job":
                job_id = clarify.get("job_id", "")
                job_title = clarify.get("job_title", "the job")
                # Inject a human-turn confirmation so the agent has the exact job_id
                # and continues naturally (ask what to edit, or call prepare_job_edit, etc.)
                confirmation_text = (
                    f"Yes, that's correct. I meant the job '{job_title}' "
                    f"(job_id: {job_id}). Please continue with my original request."
                )
            else:
                app_id = clarify.get("application_id", "")
                candidate_name = clarify.get("candidate_name", "the candidate")
                job_title = clarify.get("job_title", "that job")
                confirmation_text = (
                    f"Yes, that's correct. I meant {candidate_name} who applied for '{job_title}' "
                    f"(application_id: {app_id}). Please show me the details."
                )
        else:
            if clarification_type == "job":
                confirmation_text = (
                    "No, that's not the job I meant. "
                    "Please list all my company's jobs so I can pick the right one."
                )
            else:
                confirmation_text = (
                    "No, that's not the candidate I meant. "
                    "Please search again or show me all candidates for that role."
                )

        return {
            "messages": [HumanMessage(content=confirmation_text)],
            "pending_clarification": None,
            "clarification_type": None,
            "human_decision": None,
        }

    async def finalize_response_node(state: RecruiterChatState) -> dict[str, Any]:
        await _touch_session(state.get("session_id"))

        if state.get("agent_response") is not None:
            text = str(state["agent_response"].get("text") or "").strip()
            should_append = bool(text) and (
                not state["messages"]
                or not isinstance(state["messages"][-1], AIMessage)
                or _extract_text_content(state["messages"][-1].content).strip() != text
            )
            return {
                "messages": [AIMessage(content=text)] if should_append else [],
                "agent_response": state["agent_response"],
            }

        if state.get("edit_result") is not None:
            response = AgentResponse(
                text=state["edit_result"]["text"], ui_type="text", data=None
            )
            return {
                "messages": [AIMessage(content=response.text)],
                "agent_response": response.model_dump(mode="json"),
            }

        payloads = _latest_tool_payloads(state["messages"])
        last_payload = payloads[-1] if payloads else None
        final_ai = state["messages"][-1] if state["messages"] else None
        text = ""
        if isinstance(final_ai, AIMessage):
            text = _extract_text_content(final_ai.content)
        if not text and last_payload is not None:
            text = str(last_payload.get("text") or "").strip()
        if not text:
            text = "How can I help with recruiting today?"

        ui_type = _determine_ui_type(last_payload)
        data = (
            last_payload.get("data")
            if last_payload and ui_type != "text" and last_payload.get("ok")
            else None
        )
        response = AgentResponse(text=text, ui_type=ui_type, data=data)
        should_append = bool(text) and not isinstance(final_ai, AIMessage)
        return {
            "messages": [AIMessage(content=text)] if should_append else [],
            "agent_response": response.model_dump(mode="json"),
        }

    # ------------------------------------------------------------------
    # Routing
    # ------------------------------------------------------------------

    def route_after_agent(state: RecruiterChatState) -> str:
        return "tools" if tools_condition(state) == "tools" else "finalize_response"

    def route_after_tools(state: RecruiterChatState) -> str:
        payloads = _latest_tool_payloads(state["messages"])
        if not payloads:
            return "agent"

        last_payload = payloads[-1]
        tool_name = last_payload.get("tool")
        ok = last_payload.get("ok", True)

        # 1. Job edit preview — human must confirm before writing
        if tool_name == "prepare_job_edit" and ok:
            return "review_edit"

        # 2. Clarification requests — human must confirm which job/candidate they mean
        if tool_name in {"clarify_job_selection", "clarify_candidate_selection"} and ok:
            return "clarify"

        # 3. list_company_jobs success — agent reads the full list and decides next step
        #    (either call clarify_job_selection if ambiguous, or answer the question directly)
        if tool_name == "list_company_jobs" and ok:
            return "agent"

        # 4. Any failed tool result — agent composes a helpful response
        if not ok:
            return "agent"

        # 5. Successful visual results (salary, candidates) — go straight to finalize
        return "finalize_response"

    def route_after_review(state: RecruiterChatState) -> str:
        decision = _normalize_human_decision(state.get("human_decision"))
        return "apply_edit" if decision.get("action") == "confirm" else "cancel_edit"

    def route_after_clarification(state: RecruiterChatState) -> str:
        # Always resolve — resolve_clarification_node handles both confirm and reject
        return "resolve_clarification"

    # ------------------------------------------------------------------
    # Graph assembly
    # ------------------------------------------------------------------

    builder = StateGraph(RecruiterChatState)

    builder.add_node("validate_context", validate_context_node)
    builder.add_node("prune_messages", prune_messages_node)
    builder.add_node("agent", agent_node)
    builder.add_node("tools", ToolNode(MODEL_TOOLS))
    # Job edit flow
    builder.add_node("review_edit", review_edit_node)
    builder.add_node("apply_edit", apply_edit_node)
    builder.add_node("cancel_edit", cancel_edit_node)
    # Clarification flow (new)
    builder.add_node("clarify", clarify_node)
    builder.add_node("resolve_clarification", resolve_clarification_node)
    # Final
    builder.add_node("finalize_response", finalize_response_node)

    # Edges
    builder.add_edge(START, "validate_context")
    builder.add_edge("validate_context", "prune_messages")
    builder.add_edge("prune_messages", "agent")

    builder.add_conditional_edges(
        "agent",
        route_after_agent,
        {"tools": "tools", "finalize_response": "finalize_response"},
    )
    builder.add_conditional_edges(
        "tools",
        route_after_tools,
        {
            "agent": "prune_messages",
            "review_edit": "review_edit",
            "clarify": "clarify",
            "finalize_response": "finalize_response",
        },
    )

    # Job edit flow
    builder.add_conditional_edges(
        "review_edit",
        route_after_review,
        {"apply_edit": "apply_edit", "cancel_edit": "cancel_edit"},
    )
    builder.add_edge("apply_edit", "finalize_response")
    builder.add_edge("cancel_edit", "finalize_response")

    # Clarification flow (new)
    builder.add_conditional_edges(
        "clarify",
        route_after_clarification,
        {"resolve_clarification": "resolve_clarification"},
    )
    # After resolving, go back through prune_messages → agent so the LLM continues naturally
    builder.add_edge("resolve_clarification", "prune_messages")

    builder.add_edge("finalize_response", END)

    return builder

"""A scripted LangChain chat model, so tests run the real agents and middleware
(guardrails, limits, retries, fallback) without calling a provider."""

from __future__ import annotations

import uuid
from typing import Any

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from pydantic import Field


def answer(schema: type, **fields: Any) -> tuple[str, dict[str, Any]]:
    """A structured answer: the schema's tool call (ToolStrategy)."""
    return (schema.__name__, fields)


def call(tool: str, **args: Any) -> tuple[str, dict[str, Any]]:
    """A real tool call, e.g. call("search_salary", title="Cook", location=None)."""
    return (tool, args)


class ScriptedChatModel(BaseChatModel):
    """Each model call takes the next reply: a (tool name, args) tuple, or an
    exception to raise. `calls` keeps the messages each call saw."""

    replies: list[Any] = Field(default_factory=list)
    # Used when `replies` runs out (e.g. the same answer every turn).
    default: Any = None
    calls: list[list[BaseMessage]] = Field(default_factory=list)
    # Optional list that also gets each call, as role/content dicts with the
    # system prompt split from the data appended to it.
    recorder: Any = None
    model_name: str = "scripted"
    max_tokens: int = 100

    @property
    def _llm_type(self) -> str:
        return "scripted"

    # Tool names the agent bound; a reply for another tool is not ours.
    bound: list[str] = Field(default_factory=list)

    def bind_tools(self, tools: Any, **_kwargs: Any) -> ScriptedChatModel:
        names = [getattr(t, "name", None) or getattr(t, "__name__", "") for t in tools]
        names += [
            t.get("function", {}).get("name", "") for t in tools if isinstance(t, dict)
        ]
        # Shallow copy: replies, calls and recorder stay shared.
        return self.model_copy(update={"bound": [n for n in names if n]})

    def _generate(self, messages: list[BaseMessage], *_a: Any, **_k: Any) -> ChatResult:
        reply = self.replies[0] if self.replies else self.default
        name = reply[0] if isinstance(reply, tuple) else None
        if reply is None or (name and self.bound and name not in self.bound):
            # e.g. the injection check asking for a Verdict: "unavailable".
            raise RuntimeError("No scripted reply for this call (no live AI).")
        if self.replies:
            self.replies.pop(0)
        self.calls.append(list(messages))
        if self.recorder is not None:
            self.recorder.append(_as_dicts(messages))
        if isinstance(reply, BaseException):
            raise reply
        name, args = reply
        message = AIMessage(
            content="",
            tool_calls=[
                {"name": name, "args": args, "id": f"call_{uuid.uuid4().hex[:8]}"}
            ],
            usage_metadata={"input_tokens": 10, "output_tokens": 5, "total_tokens": 15},
            response_metadata={"model_name": self.model_name},
        )
        return ChatResult(generations=[ChatGeneration(message=message)])

    async def _agenerate(
        self, messages: list[BaseMessage], *a: Any, **k: Any
    ) -> ChatResult:
        return self._generate(messages, *a, **k)


def _as_dicts(messages: list[BaseMessage]) -> list[dict[str, str]]:
    roles = {"system": "system", "human": "user", "ai": "assistant", "tool": "tool"}
    out: list[dict[str, str]] = []
    for message in messages:
        content = message.content if isinstance(message.content, str) else ""
        if message.type == "system" and "\n\n" in content:
            prompt, data = content.rsplit("\n\n", 1)
            out += [
                {"role": "system", "content": prompt},
                {"role": "system", "content": data},
            ]
        else:
            out.append(
                {"role": roles.get(message.type, message.type), "content": content}
            )
    return out


def use_model(monkeypatch: Any, *replies: Any, **kwargs: Any) -> ScriptedChatModel:
    """Make every agent built after this call answer from `replies`."""
    from app.infrastructures.ai import llm

    model = ScriptedChatModel(replies=list(replies), **kwargs)
    monkeypatch.setattr(llm, "groq_model", lambda **_kw: model)
    return model

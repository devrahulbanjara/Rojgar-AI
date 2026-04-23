from __future__ import annotations

import uuid
from contextvars import ContextVar
from dataclasses import dataclass, replace


@dataclass(frozen=True, slots=True)
class RequestContext:
    """Immutable request metadata stored in a ContextVar for the active request."""

    request_id: str | None = None
    request_path: str | None = None
    request_method: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    actor_user_id: uuid.UUID | None = None
    actor_role: str | None = None
    source: str = "system"


_request_context: ContextVar[RequestContext] = ContextVar(
    "request_context", default=RequestContext()
)


def get_request_context() -> RequestContext:
    """Return the current request context from the ContextVar."""
    return _request_context.get()


def set_request_context(context: RequestContext):
    """Replace the current request context and return the reset token."""
    return _request_context.set(context)


def reset_request_context(token) -> None:
    """Restore the previous request context using a reset token."""
    _request_context.reset(token)


def bind_actor(*, actor_user_id: uuid.UUID | None, actor_role: str | None) -> None:
    """Attach the authenticated actor's ID and role to the current context."""
    context = get_request_context()
    _request_context.set(
        replace(
            context,
            actor_user_id=actor_user_id,
            actor_role=actor_role,
        )
    )

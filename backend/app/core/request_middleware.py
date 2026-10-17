from __future__ import annotations

import re
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.rate_limit import client_ip
from app.core.request_context import (
    RequestContext,
    reset_request_context,
    set_request_context,
)


# Client-supplied request IDs are echoed and stored in audit rows (String(100));
# accept only short, safe tokens and mint our own otherwise.
_REQUEST_ID_RE = re.compile(r"^[A-Za-z0-9._:-]{1,100}$")


def _request_id(request: Request) -> str:
    supplied = request.headers.get("X-Request-ID")
    if supplied and _REQUEST_ID_RE.fullmatch(supplied):
        return supplied
    return str(uuid.uuid4())


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Populate request-scoped metadata and propagate the request ID header."""

    async def dispatch(self, request: Request, call_next) -> Response:
        """Capture request metadata, bind it to context, and reset it safely."""
        request_id = _request_id(request)
        # Same trusted-proxy logic as rate limiting: the first X-Forwarded-For
        # entry is client-controlled and would make audit IPs spoofable.
        ip_address = client_ip(request)[:64]
        token = set_request_context(
            RequestContext(
                request_id=request_id,
                request_path=request.url.path[:500],
                request_method=request.method,
                ip_address=ip_address,
                user_agent=(request.headers.get("User-Agent") or "")[:1000] or None,
                source="api",
            )
        )
        request.state.request_id = request_id
        try:
            response = await call_next(request)
        finally:
            reset_request_context(token)
        response.headers["X-Request-ID"] = request_id
        return response

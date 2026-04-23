from __future__ import annotations

import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.request_context import (
    RequestContext,
    reset_request_context,
    set_request_context,
)


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Populate request-scoped metadata and propagate the request ID header."""

    async def dispatch(self, request: Request, call_next) -> Response:
        """Capture request metadata, bind it to context, and reset it safely."""
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        forwarded_for = request.headers.get("X-Forwarded-For")
        ip_address = (
            forwarded_for.split(",")[0].strip()
            if forwarded_for
            else request.client.host
            if request.client
            else None
        )
        token = set_request_context(
            RequestContext(
                request_id=request_id,
                request_path=request.url.path,
                request_method=request.method,
                ip_address=ip_address,
                user_agent=request.headers.get("User-Agent"),
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

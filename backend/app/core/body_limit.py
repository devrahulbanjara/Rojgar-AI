"""Reject oversized request bodies before they are read.

Upload size checks inside handlers only run after Starlette has spooled the
whole multipart body to disk, so a client could stream gigabytes per request.
This ASGI middleware rejects on the declared Content-Length and stops reading
undeclared (chunked) bodies once they exceed the limit.
"""

import json

from starlette.types import ASGIApp, Message, Receive, Scope, Send

DEFAULT_MAX_BODY_BYTES = 15 * 1024 * 1024  # resume PDFs (10 MB) + form overhead
RECORDING_MAX_BODY_BYTES = 205 * 1024 * 1024  # interview audio (200 MB)


def _limit_for(path: str) -> int:
    if path.rstrip("/").endswith("/recordings"):
        return RECORDING_MAX_BODY_BYTES
    return DEFAULT_MAX_BODY_BYTES


class _BodyTooLarge(Exception):
    pass


class BodySizeLimitMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        limit = _limit_for(scope.get("path", ""))
        declared = dict(scope.get("headers") or []).get(b"content-length")
        if declared is not None:
            try:
                if int(declared) > limit:
                    await _reject(send, limit)
                    return
            except ValueError:
                await _reject(send, limit, status=400, message="Invalid Content-Length")
                return

        received = 0
        response_started = False

        async def limited_receive() -> Message:
            nonlocal received
            message = await receive()
            if message["type"] == "http.request":
                received += len(message.get("body", b""))
                if received > limit:
                    raise _BodyTooLarge
            return message

        async def tracking_send(message: Message) -> None:
            nonlocal response_started
            if message["type"] == "http.response.start":
                response_started = True
            await send(message)

        try:
            await self.app(scope, limited_receive, tracking_send)
        except _BodyTooLarge:
            if not response_started:
                await _reject(send, limit)


async def _reject(
    send: Send, limit: int, *, status: int = 413, message: str | None = None
) -> None:
    body = json.dumps(
        {
            "success": False,
            "message": message
            or f"Request body exceeds the {limit // (1024 * 1024)}MB limit.",
            "data": None,
            "errors": None,
        }
    ).encode()
    await send(
        {
            "type": "http.response.start",
            "status": status,
            "headers": [
                (b"content-type", b"application/json"),
                (b"content-length", str(len(body)).encode()),
            ],
        }
    )
    await send({"type": "http.response.body", "body": body})

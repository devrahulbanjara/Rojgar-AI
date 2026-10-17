"""Client identification for rate limiting.

fastapi-limiter's default identifier keys on the first X-Forwarded-For entry,
which the client controls, so rotating that header bypasses every limit.
"""

from starlette.requests import Request

from app.core.config import settings


def client_ip(request: Request) -> str:
    """Best-effort client IP that a caller cannot spoof.

    With ``TRUSTED_PROXY_HOPS=0`` (default) the socket peer is used. Behind N
    trusted reverse proxies, each proxy appends the address it saw, so the
    N-th entry from the right of X-Forwarded-For is the real client.
    """
    hops = settings.trusted_proxy_hops
    if hops > 0:
        forwarded = [
            part.strip()
            for part in request.headers.get("X-Forwarded-For", "").split(",")
            if part.strip()
        ]
        if len(forwarded) >= hops:
            return forwarded[-hops]
    if request.client:
        return request.client.host
    return "unknown"


async def client_identifier(request: Request) -> str:
    """Rate-limit key: trusted client IP plus route path."""
    return f"{client_ip(request)}:{request.scope['path']}"

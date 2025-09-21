"""
Custom middleware for the application
"""

import time
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.logging import get_logger
from app.core.responses import error_response

logger = get_logger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for request/response logging"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Log request
        start_time = time.time()
        logger.info(
            f"Request: {request.method} {request.url.path}",
            extra={
                "method": request.method,
                "path": request.url.path,
                "query_params": dict(request.query_params),
                "client_ip": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent"),
            },
        )

        # Process request
        response = await call_next(request)

        # Log response
        process_time = time.time() - start_time
        logger.info(
            f"Response: {response.status_code} - {process_time:.3f}s",
            extra={
                "status_code": response.status_code,
                "process_time": process_time,
            },
        )

        return response


class CORSMiddleware(BaseHTTPMiddleware):
    """Enhanced CORS middleware with proper configuration"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Set CORS headers
        origin = request.headers.get("origin")
        if origin in settings.cors_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = (
                "GET, POST, PUT, DELETE, OPTIONS"
            )
            response.headers["Access-Control-Allow-Headers"] = (
                "Content-Type, Authorization, X-Requested-With"
            )

        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        if settings.is_production:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        return response


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware for global error handling"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            logger.error(f"Unhandled exception: {exc}", exc_info=True)

            return JSONResponse(
                status_code=500,
                content=error_response(
                    message="Internal server error", status_code=500
                ).dict(),
            )


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple rate limiting middleware"""

    def __init__(self, app, requests_per_minute: int | None = None):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute or settings.RATE_LIMIT_REQUESTS
        self.requests: dict[str, list[float]] = {}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()

        # Clean old entries
        self.requests = {
            ip: timestamps
            for ip, timestamps in self.requests.items()
            if any(ts > current_time - 60 for ts in timestamps)
        }

        # Check rate limit
        if client_ip in self.requests:
            recent_requests = [
                ts for ts in self.requests[client_ip] if ts > current_time - 60
            ]
            if len(recent_requests) >= self.requests_per_minute:
                return JSONResponse(
                    status_code=429,
                    content=error_response(
                        message="Rate limit exceeded", status_code=429
                    ).dict(),
                )
            self.requests[client_ip] = recent_requests + [current_time]
        else:
            self.requests[client_ip] = [current_time]

        return await call_next(request)

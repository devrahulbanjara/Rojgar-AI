import traceback
import uuid
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.current_datetime import get_datetime
from app.core.logging_config import logger
from app.schemas.shared import ErrorCode

SENSITIVE_FIELDS = {
    "password",
    "token",
    "secret",
    "api_key",
    "api_secret",
    "access_token",
    "refresh_token",
    "auth_token",
    "credit_card",
    "cvv",
    "ssn",
    "social_security_number",
}


def sanitize_details(details: dict[str, Any] | None) -> dict[str, Any]:
    if not details:
        return {}

    sanitized: dict[str, Any] = {}
    for key, value in details.items():
        if any(sensitive in key.lower() for sensitive in SENSITIVE_FIELDS):
            sanitized[key] = "***REDACTED***"
        elif isinstance(value, dict):
            sanitized[key] = sanitize_details(value)
        else:
            sanitized[key] = value
    return sanitized


def get_request_context(request: Request) -> dict[str, Any]:
    return {
        "request_id": getattr(request.state, "request_id", None),
    }


class ConvexHireError(Exception):
    def __init__(
        self,
        message: str,
        error_code: str,
        details: dict[str, Any] | None = None,
        user_id: uuid.UUID | None = None,
        request_id: str | None = None,
        timestamp=None,
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        self.user_id = user_id
        self.request_id = request_id
        self.timestamp = timestamp or get_datetime()
        self._traceback = traceback.format_exc()
        super().__init__(self.message)

    def to_dict(self) -> dict[str, Any]:
        return {
            "error_type": self.__class__.__name__,
            "message": self.message,
            "error_code": self.error_code,
            "details": sanitize_details(self.details),
            "user_id": str(self.user_id) if self.user_id else None,
            "request_id": self.request_id,
            "timestamp": self.timestamp.isoformat(),
        }

    def __str__(self) -> str:
        parts = [f"{self.error_code}: {self.message}"]
        if self.details:
            parts.append(f"Details: {self.details}")
        if self.user_id:
            parts.append(f"User: {self.user_id}")
        if self.request_id:
            parts.append(f"Request: {self.request_id}")
        return " | ".join(parts)


class BusinessLogicError(ConvexHireError):
    def __init__(
        self,
        message: str,
        details: dict[str, Any] | None = None,
        error_code: str = ErrorCode.BUSINESS_LOGIC_ERROR,
        **kwargs,
    ):
        super().__init__(
            message=message, error_code=error_code, details=details, **kwargs
        )


class NotFoundError(ConvexHireError):
    def __init__(
        self,
        message: str,
        details: dict[str, Any] | None = None,
        error_code: str = ErrorCode.RESOURCE_NOT_FOUND,
        **kwargs,
    ):
        super().__init__(
            message=message, error_code=error_code, details=details, **kwargs
        )


class UnauthorizedError(ConvexHireError):
    def __init__(
        self,
        message: str,
        details: dict[str, Any] | None = None,
        error_code: str = ErrorCode.UNAUTHORIZED,
        **kwargs,
    ):
        super().__init__(
            message=message, error_code=error_code, details=details, **kwargs
        )


class ForbiddenError(ConvexHireError):
    def __init__(
        self,
        message: str,
        details: dict[str, Any] | None = None,
        error_code: str = ErrorCode.FORBIDDEN,
        **kwargs,
    ):
        super().__init__(
            message=message, error_code=error_code, details=details, **kwargs
        )


class ConflictError(ConvexHireError):
    def __init__(
        self,
        message: str,
        details: dict[str, Any] | None = None,
        error_code: str = ErrorCode.RESOURCE_CONFLICT,
        **kwargs,
    ):
        super().__init__(
            message=message, error_code=error_code, details=details, **kwargs
        )


class JobNotFoundError(NotFoundError):
    def __init__(
        self,
        message: str = "Job not found",
        details: dict[str, Any] | None = None,
        **kwargs,
    ):
        super().__init__(
            message=message,
            details=details,
            error_code=ErrorCode.JOB_NOT_FOUND,
            **kwargs,
        )


class CandidateNotFoundError(NotFoundError):
    def __init__(
        self,
        message: str = "Candidate profile not found",
        details: dict[str, Any] | None = None,
        **kwargs,
    ):
        super().__init__(
            message=message,
            details=details,
            error_code=ErrorCode.CANDIDATE_NOT_FOUND,
            **kwargs,
        )


class ApplicationNotFoundError(NotFoundError):
    def __init__(
        self,
        message: str = "Application not found",
        details: dict[str, Any] | None = None,
        **kwargs,
    ):
        super().__init__(
            message=message,
            details=details,
            error_code=ErrorCode.APPLICATION_NOT_FOUND,
            **kwargs,
        )


class OrganizationNotFoundError(NotFoundError):
    def __init__(
        self,
        message: str = "Organization not found",
        details: dict[str, Any] | None = None,
        **kwargs,
    ):
        super().__init__(
            message=message,
            details=details,
            error_code=ErrorCode.ORGANIZATION_NOT_FOUND,
            **kwargs,
        )


class UserNotFoundError(NotFoundError):
    def __init__(
        self,
        message: str = "User not found",
        details: dict[str, Any] | None = None,
        **kwargs,
    ):
        super().__init__(
            message=message,
            details=details,
            error_code=ErrorCode.USER_NOT_FOUND,
            **kwargs,
        )


class ResumeNotFoundError(NotFoundError):
    def __init__(
        self,
        message: str = "Resume not found",
        details: dict[str, Any] | None = None,
        **kwargs,
    ):
        super().__init__(
            message=message,
            details=details,
            error_code=ErrorCode.RESUME_NOT_FOUND,
            **kwargs,
        )


def create_error_json(
    status_code: int,
    detail: str,
    error_code: str,
    details: dict[str, Any] | None = None,
    request_id: str | None = None,
    timestamp=None,
) -> JSONResponse:
    content: dict[str, Any] = {
        "detail": detail,
        "error_code": error_code,
    }

    if settings.ENVIRONMENT == "development" or details:
        if details:
            content["details"] = details
        if request_id:
            content["request_id"] = request_id
        if timestamp:
            content["timestamp"] = timestamp.isoformat()

    return JSONResponse(status_code=status_code, content=content)


_exception_counts: dict[str, int] = {}


def get_exception_metrics() -> dict[str, int]:
    return _exception_counts.copy()


def _increment_exception_metric(exception_type: str, error_code: str, endpoint: str):
    key = f"{exception_type}:{error_code}:{endpoint}"
    _exception_counts[key] = _exception_counts.get(key, 0) + 1


def setup_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        request_id = getattr(request.state, "request_id", None)
        endpoint = request.url.path

        _increment_exception_metric(
            exception_type=type(exc).__name__,
            error_code=ErrorCode.INTERNAL_SERVER_ERROR,
            endpoint=endpoint,
        )

        logger.error(
            f"Internal Server Error: {exc}",
            extra={
                "request_id": request_id,
                "url": str(request.url),
                "method": request.method,
                "client_ip": request.client.host if request.client else None,
                "endpoint": endpoint,
            },
            exc_info=True,
        )
        return create_error_json(
            500,
            "An unexpected error occurred",
            ErrorCode.INTERNAL_SERVER_ERROR,
            request_id=request_id,
        )

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        request_id = getattr(request.state, "request_id", None)
        return create_error_json(
            400, str(exc), ErrorCode.BUSINESS_LOGIC_ERROR, request_id=request_id
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        request_id = getattr(request.state, "request_id", None)
        details_list = []
        for error in exc.errors():
            field = ".".join(str(loc) for loc in error["loc"] if loc != "body")
            details_list.append(f"{field}: {error['msg']}")

        validation_details = {"validation_errors": details_list}
        return create_error_json(
            422,
            f"Validation failed: {', '.join(details_list)}",
            ErrorCode.VALIDATION_ERROR,
            details=validation_details,
            request_id=request_id,
        )

    @app.exception_handler(ValidationError)
    async def pydantic_validation_exception_handler(
        request: Request, exc: ValidationError
    ):
        request_id = getattr(request.state, "request_id", None)
        error_details = []
        for error in exc.errors():
            field = " -> ".join(str(loc) for loc in error["loc"])
            error_details.append(f"{field}: {error['msg']}")
        validation_details = {"validation_errors": error_details}
        return create_error_json(
            422,
            f"Validation error: {'; '.join(error_details)}",
            ErrorCode.VALIDATION_ERROR,
            details=validation_details,
            request_id=request_id,
        )

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        request_id = getattr(request.state, "request_id", None)
        return create_error_json(
            429,
            "Too many requests",
            ErrorCode.RATE_LIMIT_EXCEEDED,
            request_id=request_id,
        )

    @app.exception_handler(ConvexHireError)
    async def convexhire_error_handler(request: Request, exc: ConvexHireError):
        request_id = getattr(request.state, "request_id", None) or exc.request_id
        endpoint = request.url.path

        _increment_exception_metric(
            exception_type=type(exc).__name__,
            error_code=exc.error_code,
            endpoint=endpoint,
        )

        logger.error(
            "ConvexHire Error: {}",
            str(exc),
            extra={
                **exc.to_dict(),
                "url": str(request.url),
                "method": request.method,
                "client_ip": request.client.host if request.client else None,
                "endpoint": endpoint,
            },
        )

        status_code_map = {
            BusinessLogicError: 400,
            NotFoundError: 404,
            UnauthorizedError: 401,
            ForbiddenError: 403,
            ConflictError: 409,
        }
        status_code = status_code_map.get(type(exc), 500)

        sanitized_details = sanitize_details(exc.details) if exc.details else None

        return create_error_json(
            status_code=status_code,
            detail=exc.message,
            error_code=exc.error_code,
            details=sanitized_details,
            request_id=request_id,
            timestamp=exc.timestamp,
        )

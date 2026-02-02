from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from slowapi.errors import RateLimitExceeded

from app.core.logging_config import logger
from app.schemas.shared import ErrorCode, ErrorResponse


class ConvexHireError(Exception):
    def __init__(self, message: str, error_code: str):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class BusinessLogicError(ConvexHireError):
    def __init__(self, message: str, error_code: str = ErrorCode.BUSINESS_LOGIC_ERROR):
        super().__init__(message, error_code)


class NotFoundError(ConvexHireError):
    def __init__(self, message: str, error_code: str = ErrorCode.RESOURCE_NOT_FOUND):
        super().__init__(message, error_code)


class UnauthorizedError(ConvexHireError):
    def __init__(self, message: str, error_code: str = ErrorCode.UNAUTHORIZED):
        super().__init__(message, error_code)


class ForbiddenError(ConvexHireError):
    def __init__(self, message: str, error_code: str = ErrorCode.FORBIDDEN):
        super().__init__(message, error_code)


class ConflictError(ConvexHireError):
    def __init__(self, message: str, error_code: str = ErrorCode.RESOURCE_CONFLICT):
        super().__init__(message, error_code)


class JobNotFoundError(NotFoundError):
    def __init__(self, message: str = "Job not found"):
        super().__init__(message, ErrorCode.JOB_NOT_FOUND)


class CandidateNotFoundError(NotFoundError):
    def __init__(self, message: str = "Candidate profile not found"):
        super().__init__(message, ErrorCode.CANDIDATE_NOT_FOUND)


class ApplicationNotFoundError(NotFoundError):
    def __init__(self, message: str = "Application not found"):
        super().__init__(message, ErrorCode.APPLICATION_NOT_FOUND)


class OrganizationNotFoundError(NotFoundError):
    def __init__(self, message: str = "Organization not found"):
        super().__init__(message, ErrorCode.ORGANIZATION_NOT_FOUND)


class UserNotFoundError(NotFoundError):
    def __init__(self, message: str = "User not found"):
        super().__init__(message, ErrorCode.USER_NOT_FOUND)


class ResumeNotFoundError(NotFoundError):
    def __init__(self, message: str = "Resume not found"):
        super().__init__(message, ErrorCode.RESUME_NOT_FOUND)


def create_error_json(status_code: int, detail: str, error_code: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=ErrorResponse(detail=detail, error_code=error_code).model_dump(),
    )


def setup_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Internal Server Error: {exc}", exc_info=True)
        return create_error_json(
            500, "An unexpected error occurred", ErrorCode.INTERNAL_SERVER_ERROR
        )

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        return create_error_json(400, str(exc), ErrorCode.BUSINESS_LOGIC_ERROR)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        details = []
        for error in exc.errors():
            field = ".".join(str(loc) for loc in error["loc"] if loc != "body")
            details.append(f"{field}: {error['msg']}")

        return create_error_json(
            422,
            f"Validation failed: {', '.join(details)}",
            ErrorCode.VALIDATION_ERROR,
        )

    @app.exception_handler(ValidationError)
    async def pydantic_validation_exception_handler(
        request: Request, exc: ValidationError
    ):
        error_details = []
        for error in exc.errors():
            field = " -> ".join(str(loc) for loc in error["loc"])
            error_details.append(f"{field}: {error['msg']}")
        return create_error_json(
            422,
            f"Validation error: {'; '.join(error_details)}",
            ErrorCode.VALIDATION_ERROR,
        )

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        return create_error_json(
            429, "Too many requests", ErrorCode.RATE_LIMIT_EXCEEDED
        )

    @app.exception_handler(NotFoundError)
    async def not_found_handler(request: Request, exc: NotFoundError):
        return create_error_json(404, exc.message, exc.error_code)

    @app.exception_handler(UnauthorizedError)
    async def unauthorized_handler(request: Request, exc: UnauthorizedError):
        return create_error_json(401, exc.message, exc.error_code)

    @app.exception_handler(ForbiddenError)
    async def forbidden_handler(request: Request, exc: ForbiddenError):
        return create_error_json(403, exc.message, exc.error_code)

    @app.exception_handler(BusinessLogicError)
    async def business_logic_handler(request: Request, exc: BusinessLogicError):
        return create_error_json(400, exc.message, exc.error_code)

    @app.exception_handler(ConflictError)
    async def conflict_handler(request: Request, exc: ConflictError):
        return create_error_json(409, exc.message, exc.error_code)

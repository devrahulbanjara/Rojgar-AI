from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.responses import ResponseBuilder


def register_exception_handlers(app: FastAPI) -> None:
    """
    Attach all global exception handlers to the FastAPI app.
    Call this once in main.py after the app is created.
    """

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request, exc: RequestValidationError):
        """422 Pydantic validation errors → 400 with field-level details."""
        error_details = [
            {"field": " -> ".join(map(str, err["loc"][1:])), "message": err["msg"]}
            for err in exc.errors()
        ]
        return ResponseBuilder.error(
            errors=error_details,
            message="Validation failed",
            status_code=400,
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request, exc: StarletteHTTPException):
        """Standard HTTP errors (401, 403, 404, …) in the unified envelope."""
        return ResponseBuilder.error(
            message=str(exc.detail),
            status_code=exc.status_code,
        )

    @app.exception_handler(Exception)
    async def universal_exception_handler(request, exc: Exception):
        """Catch-all for unexpected crashes — never leaks tracebacks in production."""
        return ResponseBuilder.error(
            message="An internal server error occurred.",
            errors=str(exc) if settings.debug else None,
            status_code=500,
        )

from datetime import UTC, datetime
from typing import Any, Generic, TypeVar

from fastapi import Response, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from app.core.request_context import get_request_context

T = TypeVar("T")


class ResponseMeta(BaseModel):
    """Metadata attached to every response envelope."""

    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requestId: str | None = None


class UnifiedResponse(BaseModel, Generic[T]):
    """
    The master response envelope.

    Every endpoint returns this shape so the frontend can rely on a single
    Axios interceptor to handle success, validation errors, and system crashes.

    Shape:
        {
            "success": true | false,
            "message": "Human-readable summary",
            "data":   <payload or null>,
            "errors": <validation errors or null>,
            "meta":   { "timestamp": "...", "requestId": null }
        }
    """

    success: bool
    message: str
    data: T | None = None
    errors: Any | None = None
    meta: ResponseMeta = ResponseMeta()

    model_config = ConfigDict(from_attributes=True)


class ResponseBuilder:
    """
    Utility that produces a :class:`JSONResponse` already wrapped in the
    :class:`UnifiedResponse` envelope.

    Uses FastAPI's ``jsonable_encoder`` so SQLAlchemy ORM objects, Pydantic
    models, datetimes, and UUIDs are all serialised correctly.
    """

    @staticmethod
    def _meta() -> dict:
        """Build the response metadata block from the current request context."""
        request_context = get_request_context()
        return {
            "timestamp": datetime.now(UTC).isoformat(),
            "requestId": request_context.request_id,
        }

    @staticmethod
    def success(
        data: Any = None,
        message: str = "Operation successful",
        status_code: int = status.HTTP_200_OK,
        response: Response | None = None,
    ) -> Any:
        """Wrap a successful payload in the unified response envelope."""
        content = {
            "success": True,
            "message": message,
            "data": jsonable_encoder(data),
            "errors": None,
            "meta": ResponseBuilder._meta(),
        }
        json_response = JSONResponse(status_code=status_code, content=content)

        if response is not None:
            json_response.raw_headers.extend(response.raw_headers)

        return json_response

    @staticmethod
    def error(
        errors: Any = None,
        message: str = "An error occurred",
        status_code: int = status.HTTP_400_BAD_REQUEST,
        response: Response | None = None,
    ) -> Any:
        """Wrap an error payload in the unified response envelope."""
        content = {
            "success": False,
            "message": message,
            "data": None,
            "errors": jsonable_encoder(errors),
            "meta": ResponseBuilder._meta(),
        }
        json_response = JSONResponse(status_code=status_code, content=content)

        if response is not None:
            json_response.raw_headers.extend(response.raw_headers)

        return json_response

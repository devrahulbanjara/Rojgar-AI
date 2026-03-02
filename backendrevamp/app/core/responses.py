from typing import Any, Generic, TypeVar
from datetime import datetime, timezone

from fastapi import status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ResponseMeta(BaseModel):
    """Metadata attached to every response envelope."""

    timestamp: datetime = datetime.now(timezone.utc)
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
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "requestId": None,
        }

    @staticmethod
    def success(
        data: Any = None,
        message: str = "Operation successful",
        status_code: int = status.HTTP_200_OK,
    ) -> JSONResponse:
        content = {
            "success": True,
            "message": message,
            "data": jsonable_encoder(data),
            "errors": None,
            "meta": ResponseBuilder._meta(),
        }
        return JSONResponse(status_code=status_code, content=content)

    @staticmethod
    def error(
        errors: Any = None,
        message: str = "An error occurred",
        status_code: int = status.HTTP_400_BAD_REQUEST,
    ) -> JSONResponse:
        content = {
            "success": False,
            "message": message,
            "data": None,
            "errors": jsonable_encoder(errors),
            "meta": ResponseBuilder._meta(),
        }
        return JSONResponse(status_code=status_code, content=content)

import math
from typing import Any, Generic, TypeVar, List
from datetime import datetime, timezone

from fastapi import Response, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class PaginationMeta(BaseModel):
    """Metadata for paginated responses."""

    total: int
    page: int
    size: int
    total_pages: int


class PaginatedData(BaseModel, Generic[T]):
    """Wrapper for paginated collection and its metadata."""

    items: List[T]
    pagination: PaginationMeta


class ResponseMeta(BaseModel):
    """Metadata attached to every response envelope."""

    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


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
    data: T | PaginatedData[T] | None = None
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
        }

    @staticmethod
    def success(
        data: Any = None,
        message: str = "Operation successful",
        status_code: int = status.HTTP_200_OK,
        response: Response | None = None,
    ) -> JSONResponse:
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
    ) -> JSONResponse:
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

    @staticmethod
    def paginated(
        items: list[Any],
        total: int,
        page: int,
        size: int,
        message: str = "Data fetched successfully",
        status_code: int = status.HTTP_200_OK,
    ) -> JSONResponse:
        total_pages = math.ceil(total / size) if size > 0 else 0
        content = {
            "success": True,
            "message": message,
            "data": {
                "items": jsonable_encoder(items),
                "pagination": {
                    "total": total,
                    "page": page,
                    "size": size,
                    "total_pages": total_pages,
                },
            },
            "errors": None,
            "meta": ResponseBuilder._meta(),
        }
        return JSONResponse(status_code=status_code, content=content)

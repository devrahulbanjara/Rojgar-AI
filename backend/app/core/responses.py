"""
Standardized API response schemas and utilities
"""

from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

from app.core.exceptions import ConvexHireException

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Standard API response wrapper"""

    success: bool = Field(description="Whether the request was successful")
    message: str = Field(description="Human-readable message")
    data: Optional[T] = Field(default=None, description="Response data")
    errors: Optional[List[Dict[str, Any]]] = Field(
        default=None, description="Error details"
    )
    meta: Optional[Dict[str, Any]] = Field(
        default=None, description="Additional metadata"
    )


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper"""

    items: List[T] = Field(description="List of items")
    total: int = Field(description="Total number of items")
    page: int = Field(description="Current page number")
    per_page: int = Field(description="Items per page")
    pages: int = Field(description="Total number of pages")
    has_next: bool = Field(description="Whether there's a next page")
    has_prev: bool = Field(description="Whether there's a previous page")


class ErrorDetail(BaseModel):
    """Error detail schema"""

    field: Optional[str] = Field(
        default=None, description="Field that caused the error"
    )
    message: str = Field(description="Error message")
    code: Optional[str] = Field(default=None, description="Error code")


def success_response(
    data: Any = None, message: str = "Success", meta: Optional[Dict[str, Any]] = None
) -> APIResponse:
    """Create a successful API response"""
    return APIResponse(success=True, message=message, data=data, meta=meta)


def error_response(
    message: str = "An error occurred",
    errors: Optional[List[Dict[str, Any]]] = None,
    status_code: int = 500,
) -> APIResponse:
    """Create an error API response"""
    return APIResponse(success=False, message=message, errors=errors)


def paginated_response(
    items: List[T], total: int, page: int, per_page: int
) -> PaginatedResponse[T]:
    """Create a paginated response"""
    pages = (total + per_page - 1) // per_page

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
        has_next=page < pages,
        has_prev=page > 1,
    )


def handle_exception(exc: Exception) -> APIResponse:
    """Convert exceptions to standardized API responses"""
    if isinstance(exc, ConvexHireException):
        return APIResponse(
            success=False,
            message=exc.message,
            errors=[{"detail": exc.details}] if exc.details else None,
        )

    # Handle other exceptions
    return APIResponse(
        success=False,
        message="An unexpected error occurred",
        errors=[{"detail": str(exc)}],
    )

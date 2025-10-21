"""
Centralized exception handling for the application
"""

from typing import Union
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
import logging

logger = logging.getLogger(__name__)


class ConvexHireException(Exception):
    """Base exception for ConvexHire application"""
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ResourceNotFoundError(ConvexHireException):
    """Raised when a requested resource is not found"""
    def __init__(self, resource_type: str, resource_id: str = None):
        message = f"{resource_type} not found"
        if resource_id:
            message += f" with ID: {resource_id}"
        super().__init__(message, status.HTTP_404_NOT_FOUND)


class UnauthorizedError(ConvexHireException):
    """Raised when user is not authorized to access a resource"""
    def __init__(self, message: str = "Not authorized to access this resource"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)


class ValidationError(ConvexHireException):
    """Raised when data validation fails"""
    def __init__(self, message: str = "Validation error"):
        super().__init__(message, status.HTTP_400_BAD_REQUEST)


class DatabaseError(ConvexHireException):
    """Raised when database operations fail"""
    def __init__(self, message: str = "Database operation failed"):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR)


def register_exception_handlers(app: FastAPI) -> None:
    """Register all exception handlers with the FastAPI app"""
    
    @app.exception_handler(ConvexHireException)
    async def convexhire_exception_handler(request: Request, exc: ConvexHireException):
        """Handle custom ConvexHire exceptions"""
        logger.error(f"ConvexHire exception: {exc.message}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message, "type": exc.__class__.__name__}
        )
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """Handle FastAPI HTTP exceptions"""
        logger.error(f"HTTP exception: {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "type": "HTTPException"}
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle request validation errors"""
        logger.error(f"Validation error: {exc.errors()}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "Request validation failed",
                "errors": exc.errors(),
                "type": "ValidationError"
            }
        )
    
    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(request: Request, exc: IntegrityError):
        """Handle database integrity errors"""
        logger.error(f"Database integrity error: {str(exc)}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": "Database integrity constraint violated",
                "type": "IntegrityError"
            }
        )
    
    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError):
        """Handle general SQLAlchemy errors"""
        logger.error(f"Database error: {str(exc)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "Database operation failed",
                "type": "DatabaseError"
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle all other exceptions"""
        logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "Internal server error",
                "type": "InternalServerError"
            }
        )

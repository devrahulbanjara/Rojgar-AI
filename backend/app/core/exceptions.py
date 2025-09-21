"""
Custom exceptions for the application
"""

from typing import Any, Dict, Optional


class ConvexHireException(Exception):
    """Base exception for ConvexHire application"""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(ConvexHireException):
    """Authentication related errors"""

    def __init__(
        self,
        message: str = "Authentication failed",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message, 401, details)


class AuthorizationError(ConvexHireException):
    """Authorization related errors"""

    def __init__(
        self, message: str = "Access denied", details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, 403, details)


class ValidationError(ConvexHireException):
    """Validation related errors"""

    def __init__(
        self,
        message: str = "Validation failed",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message, 422, details)


class NotFoundError(ConvexHireException):
    """Resource not found errors"""

    def __init__(
        self,
        message: str = "Resource not found",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message, 404, details)


class ConflictError(ConvexHireException):
    """Resource conflict errors"""

    def __init__(
        self,
        message: str = "Resource conflict",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message, 409, details)

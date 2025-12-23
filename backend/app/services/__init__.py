"""
Services package - Business logic layer.

This module provides service classes for handling business logic.
Import from here instead of individual submodules for a cleaner API.

"""

# Auth service
from .auth import AuthService
from .user_service import UserService
from .candidate import CandidateService

__all__ = [
    "AuthService",
    "UserService",
    "CandidateService",
]

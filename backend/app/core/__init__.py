"""
Core package - Configuration, database, security, and utilities.

This module provides the foundational infrastructure for the application.
Import from here instead of individual submodules for a cleaner API.

Example:
    from app.core import settings, get_db, get_current_user_id
"""

# Configuration
from .config import settings, Settings

# Database
from .database import engine, init_db, get_db

# Security
from .security import (
    hash_password,
    verify_password,
    create_token,
    verify_token,
    get_current_user_id,
)

# Logging
from .logging_config import logger, configure_file_logging, get_logger

__all__ = [
    # Configuration
    "settings",
    "Settings",
    # Database
    "engine",
    "init_db",
    "get_db",
    # Security
    "hash_password",
    "verify_password",
    "create_token",
    "verify_token",
    "get_current_user_id",
    # Logging
    "logger",
    "configure_file_logging",
    "get_logger",
]

"""
SQLAlchemy models and Pydantic schemas
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models"""
    pass


# Import all models to ensure they're registered with Base.metadata
from app.models.user import User  # noqa: E402, F401
from app.models.job import Job, Company  # noqa: E402, F401
from app.models.application import Application  # noqa: E402, F401

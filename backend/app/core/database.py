"""
Database setup - Simple SQLite database with SQLAlchemy
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models import Base

# Create the database engine
engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
)


def init_db():
    """
    Create all database tables
    Call this once when the app starts
    """
    Base.metadata.create_all(engine)


def get_db():
    """
    Get a database session
    Use this in your routes like: db = next(get_db())
    """
    with Session(engine) as session:
        yield session

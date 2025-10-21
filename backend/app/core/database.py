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
    echo=False,  # Set to True to see SQL queries in console
    connect_args={
        "check_same_thread": False,  # Needed for SQLite
        "timeout": 30,  # Wait up to 30 seconds for database lock
    },
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=3600,  # Recycle connections every hour
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

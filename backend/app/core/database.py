"""
Database configuration and session management
"""

from typing import Generator
from sqlmodel import SQLModel, Session, create_engine
from app.core.config import settings

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    connect_args={"check_same_thread": False}  # Needed for SQLite
)


def init_db() -> None:
    """
    Initialize database tables
    Create all tables defined in SQLModel models
    """
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """
    Dependency function to get database session
    Yields a session and ensures it's closed after use
    """
    with Session(engine) as session:
        yield session


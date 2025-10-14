"""
Database setup - Simple SQLite database with SQLModel
"""

from sqlmodel import SQLModel, Session, create_engine
from app.core.config import settings

# Create the database engine
# This connects to our SQLite database
engine = create_engine(
    settings.DATABASE_URL,
    echo=False,  # Set to True to see SQL queries in console
    connect_args={"check_same_thread": False}  # Needed for SQLite
)


def init_db():
    """
    Create all database tables
    Call this once when the app starts
    """
    SQLModel.metadata.create_all(engine)


def get_db():
    """
    Get a database session
    Use this in your routes like: db = next(get_db())
    """
    with Session(engine) as session:
        yield session

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from .config import settings
from app.models import Base

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
)


def init_db():
    Base.metadata.create_all(engine)


def get_db():
    with Session(engine) as session:
        yield session

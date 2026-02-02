from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session

from .config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(settings.DATABASE_URL, echo=False)


def init_db():
    Base.metadata.create_all(engine)


def get_db():
    with Session(engine) as session:
        yield session

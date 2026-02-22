import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core import get_datetime
from app.db.base import Base

if TYPE_CHECKING:
    from .application import JobApplication


class Interview(Base):
    __tablename__ = "interview"

    interview_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("job_application.application_id", ondelete="CASCADE"),
        nullable=False,
    )
    organizer_email: Mapped[str] = mapped_column(String, nullable=False)
    candidate_email: Mapped[str] = mapped_column(String, nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(
        String, default="scheduled", nullable=False
    )  # scheduled, canceled, completed
    meeting_url: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, onupdate=get_datetime, nullable=False
    )

    application: Mapped["JobApplication"] = relationship(
        "JobApplication", backref="interviews"
    )

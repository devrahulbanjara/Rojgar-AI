import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class JobAIDraft(Base):
    __tablename__ = "job_ai_drafts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)

    recruiter_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    thread_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)

    status: Mapped[str] = mapped_column(String(50), nullable=False, default="drafting")
    mode: Mapped[str] = mapped_column(String(50), nullable=False, default="create")

    source_prompt: Mapped[str | None] = mapped_column(Text)
    source_text: Mapped[str | None] = mapped_column(Text)

    locked_fields: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list
    )

    latest_draft: Mapped[dict | None] = mapped_column(JSONB)
    salary_research: Mapped[dict | None] = mapped_column(JSONB)

    assumptions: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list
    )
    warnings: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list
    )
    missing_fields: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list
    )

    last_interrupt: Mapped[dict | None] = mapped_column(JSONB)

    committed_job_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

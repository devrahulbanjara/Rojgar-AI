import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MagicLinkToken(Base):
    """One-time passwordless sign-in link for candidates.

    Only the SHA-256 of the token is stored, so a database leak cannot be
    replayed as sign-in links.
    """

    __tablename__ = "magic_link_tokens"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class JobSuggestion(Base):
    """Someone suggested a person they know for a job ("Suggest someone you know").

    The suggested person gets the job link by SMS; when they apply through it,
    the application is marked source=referral and linked here, so the business
    sees who suggested them.
    """

    __tablename__ = "job_suggestions"
    __table_args__ = (
        UniqueConstraint("job_id", "phone", name="uq_job_suggestion_phone"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    referrer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    referrer_phone: Mapped[str | None] = mapped_column(String(20))
    # The ?ref= share-link token the referrer arrived with, if any.
    referrer_ref: Mapped[str | None] = mapped_column(String(64))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    note: Mapped[str | None] = mapped_column(String(500))
    # Goes in the SMS link (?ref=) so the application can be matched back.
    token: Mapped[str] = mapped_column(String(32), nullable=False, unique=True)
    application_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("applications.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

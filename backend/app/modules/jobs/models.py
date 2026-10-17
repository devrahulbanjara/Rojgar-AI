import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Uuid,
    event,
    func,
    select,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.modules.companies.models import Company
from app.shared.slugs import job_slug
from app.shared.enums import (
    EmploymentType,
    JobCategory,
    JobStatus,
    LocationType,
    SyncAction,
    SyncStatus,
)


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    posted_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    # Public URL id for the shareable apply link (/jobs/{slug}).
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    location: Mapped[str | None] = mapped_column(String(255))
    location_type: Mapped[LocationType] = mapped_column(
        nullable=False, server_default="onsite"
    )
    salary_min: Mapped[int | None] = mapped_column(Integer)
    salary_max: Mapped[int | None] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(10), server_default="NPR")
    category: Mapped[JobCategory] = mapped_column(
        SAEnum(JobCategory, name="jobcategory"),
        nullable=False,
        default=JobCategory.other,
        server_default=JobCategory.other.value,
        index=True,
    )
    employment_type: Mapped[EmploymentType] = mapped_column(
        SAEnum(EmploymentType, name="employmenttype"),
        nullable=False,
        default=EmploymentType.full_time,
        server_default=EmploymentType.full_time.value,
    )
    status: Mapped[JobStatus] = mapped_column(
        SAEnum(JobStatus, name="jobstatus"),
        nullable=False,
        default=JobStatus.draft,
        server_default=JobStatus.draft.value,
        index=True,
    )
    # hired | cancelled | expired, set when status becomes closed.
    closed_reason: Mapped[str | None] = mapped_column(String(20), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    # Open jobs close themselves at this time (closed_reason = expired).
    closes_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    # One Markdown field: what the job is, what the person does, what it offers.
    description: Mapped[str] = mapped_column(
        Text, nullable=False, default="", server_default=""
    )
    # Short criteria the review checks (<= 6 each). Confirmed by the recruiter.
    must_haves: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list, server_default="{}"
    )
    nice_to_haves: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list, server_default="{}"
    )
    # Up to 3: [{"label": str, "type": "short_text" | "yes_no", "required": bool}]
    questions: Mapped[list[dict]] = mapped_column(
        JSONB, nullable=False, default=list, server_default="[]"
    )
    jd_embedding: Mapped[list[float] | None] = mapped_column(
        ARRAY(Float), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    company: Mapped[Company] = relationship("Company", lazy="raise")


class JobSyncEvent(Base):
    __tablename__ = "job_sync_events"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False, index=True)
    action: Mapped[SyncAction] = mapped_column(nullable=False)
    status: Mapped[SyncStatus] = mapped_column(nullable=False, server_default="PENDING")
    error_message: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


@event.listens_for(Job, "before_insert")
def _assign_job_slug(_mapper, connection, target: Job) -> None:
    """Give every new job a readable, unique public slug."""
    if target.slug:
        return
    company_name = connection.execute(
        select(Company.name).where(Company.id == target.company_id)
    ).scalar()
    while True:
        candidate = job_slug(target.title or "job", company_name)
        taken = connection.execute(select(Job.id).where(Job.slug == candidate)).first()
        if taken is None:
            target.slug = candidate
            return

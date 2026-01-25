from datetime import date

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.job import JobPosting

VISIBLE_STATUSES = ["active"]


def get_latest_jobs(db: Session, limit: int = 200) -> list[JobPosting]:
    """Get latest jobs ordered by posted date."""
    today = date.today()
    stmt = (
        select(JobPosting)
        .options(
            selectinload(JobPosting.organization),
            selectinload(JobPosting.job_description),
        )
        .where(JobPosting.status.in_(VISIBLE_STATUSES))
        .where(
            or_(
                JobPosting.application_deadline.is_(None),
                JobPosting.application_deadline >= today,
            )
        )
        .order_by(JobPosting.posted_date.desc())
        .limit(limit)
    )
    return db.execute(stmt).scalars().all()

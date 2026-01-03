from sqlalchemy.orm import Session, selectinload

from app.models.job import JobPosting

VISIBLE_STATUSES = ["active"]


def get_latest_jobs(db: Session, limit: int = 200) -> list[JobPosting]:
    """Get latest jobs ordered by posted date."""
    return (
        db.query(JobPosting)
        .options(
            selectinload(JobPosting.company),
            selectinload(JobPosting.job_description),
            selectinload(JobPosting.stats),
        )
        .filter(JobPosting.status.in_(VISIBLE_STATUSES))
        .order_by(JobPosting.posted_date.desc())
        .limit(limit)
        .all()
    )

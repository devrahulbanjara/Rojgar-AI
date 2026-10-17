"""Rules that hold however a job is saved (any service, any branch of code).

- Only an approved (active) business can publish a job.
- A published job is scanned for fee requests and unfair must-haves; matches
  are flagged for platform staff.
- Public pages hide jobs of suspended businesses and jobs staff unpublished.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import event, exists, insert, inspect, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.admin.flags import job_text, scan
from app.modules.admin.models import JobReport, JobTakedown
from app.modules.auth.enums import BusinessStatus
from app.modules.companies.models import Company
from app.modules.jobs.models import Job

# "active" today, "open" in data model v2.
PUBLISHED = {"active", "open"}

PUBLISH_BLOCKED = {
    BusinessStatus.pending: "Your business is waiting for approval. You can "
    "publish jobs once it's approved (usually the same day).",
    BusinessStatus.rejected: "Your business wasn't approved, so jobs can't go "
    "live. Add the missing details and we'll check again.",
    BusinessStatus.suspended: "Your business is suspended, so jobs can't go "
    "live. Contact Rojgar AI support.",
}


def _value(status_value) -> str | None:
    return getattr(status_value, "value", status_value)


def _is_published(job: Job) -> bool:
    return _value(job.status) in PUBLISHED


def _ensure_can_publish(connection, company_id: uuid.UUID) -> None:
    business_status = connection.execute(
        select(Company.status).where(Company.id == company_id)
    ).scalar_one_or_none()
    if business_status is not None and business_status != BusinessStatus.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=PUBLISH_BLOCKED[BusinessStatus(business_status)],
        )


def _just_published(job: Job) -> bool:
    history = inspect(job).attrs.status.history
    return (
        history.has_changes()
        and _is_published(job)
        and not any(_value(old) in PUBLISHED for old in history.deleted)
    )


def _flag(connection, job: Job) -> None:
    findings = scan(job_text(job))
    if not findings:
        return
    already = connection.execute(
        select(JobReport.reason).where(
            JobReport.job_id == job.id,
            JobReport.source == "auto",
            JobReport.resolved_at.is_(None),
        )
    ).scalars()
    open_reasons = set(already)
    rows = [
        {
            "id": uuid.uuid4(),
            "job_id": job.id,
            "company_id": job.company_id,
            "source": "auto",
            "reason": reason,
            "details": f'Found: "{phrase}"',
        }
        for reason, phrase in findings
        if reason not in open_reasons
    ]
    if rows:
        connection.execute(insert(JobReport), rows)


@event.listens_for(Job, "before_insert")
def _before_insert(_mapper, connection, job: Job) -> None:
    if _is_published(job):
        _ensure_can_publish(connection, job.company_id)


@event.listens_for(Job, "before_update")
def _before_update(_mapper, connection, job: Job) -> None:
    if _just_published(job):
        _ensure_can_publish(connection, job.company_id)


@event.listens_for(Job, "after_insert")
@event.listens_for(Job, "after_update")
def _after_save(_mapper, connection, job: Job) -> None:
    if _is_published(job):
        _flag(connection, job)


async def is_publicly_visible(db: AsyncSession, job: Job, company: Company) -> bool:
    """False for jobs of suspended businesses and jobs staff unpublished."""
    if company.status == BusinessStatus.suspended:
        return False
    taken_down = await db.scalar(select(exists().where(JobTakedown.job_id == job.id)))
    return not taken_down


async def taken_down_job_ids(db: AsyncSession, company_id: uuid.UUID) -> set:
    rows = await db.scalars(
        select(JobTakedown.job_id)
        .join(Job, Job.id == JobTakedown.job_id)
        .where(Job.company_id == company_id)
    )
    return set(rows)

from datetime import UTC, datetime, timedelta

import app.modules.jobs.service as jobs_service
from app.shared.enums import ApplicationStage, JobStatus
from tests.integration.helpers import (
    make_active_job,
    make_application,
    make_candidate_with_resume,
    make_recruiter_admin,
)


async def test_closing_uses_timestamp_and_decides_nothing(db):
    _, company = await make_recruiter_admin(db, email="expiry_admin@example.com")
    now = datetime.now(UTC)
    later_today = await make_active_job(
        db, company.id, title="Later", closes_at=now + timedelta(minutes=30)
    )
    overdue = await make_active_job(
        db, company.id, title="Overdue", closes_at=now - timedelta(minutes=1)
    )
    candidate, resume = await make_candidate_with_resume(db, "expiry_cand@example.com")
    application = await make_application(db, candidate.id, overdue.id, resume.id)

    closed = await jobs_service.close_due_jobs(db)

    await db.refresh(later_today)
    await db.refresh(overdue)
    await db.refresh(application)
    assert closed == 1
    assert overdue.status == JobStatus.closed
    assert overdue.closed_reason == "expired"
    assert later_today.status == JobStatus.open
    # Closing only stops new applications; a person still decides.
    assert application.stage == ApplicationStage.new

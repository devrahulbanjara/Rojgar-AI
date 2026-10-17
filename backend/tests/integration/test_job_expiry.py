from datetime import datetime, timedelta, timezone

import app.modules.jobs.service as jobs_service
import app.modules.shortlisting.service as shortlisting_service
from app.shared.enums import JobStatus
from tests.integration.helpers import make_active_job, make_recruiter_admin


async def test_expiry_uses_timestamp_not_date(db, monkeypatch):
    async def _noop(*_args, **_kwargs):
        return None

    monkeypatch.setattr(jobs_service, "process_sync_event", _noop)
    monkeypatch.setattr(shortlisting_service, "auto_finalize_expired_job", _noop)
    monkeypatch.setattr(shortlisting_service, "run_two_stage_for_expired_job", _noop)

    _, company = await make_recruiter_admin(db, email="expiry_admin@example.com")
    now = datetime.now(timezone.utc)
    later_today = await make_active_job(
        db, company.id, title="Later", expires_at=now + timedelta(minutes=30)
    )
    overdue = await make_active_job(
        db, company.id, title="Overdue", expires_at=now - timedelta(minutes=1)
    )

    expired = await jobs_service.expire_due_jobs(db)

    await db.refresh(later_today)
    await db.refresh(overdue)
    assert expired == 1
    assert overdue.status == JobStatus.expired
    assert later_today.status == JobStatus.active

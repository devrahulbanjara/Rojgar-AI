"""Outreach: no AI-inferred decisions, no AI judgments in mail, honest sends."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine

from app.modules.applications.models import Application
from app.modules.outreach import service as outreach_service
from app.modules.outreach.email_composer import compose_email, sanitize_email_html
from app.modules.outreach.models import EmailDraft
from app.shared.enums import ApplicationStatus, JobStatus
from tests.integration.helpers import (
    auth_headers,
    make_active_job,
    make_application,
    make_candidate_with_resume,
    make_recruiter_admin,
)


async def test_rejection_mail_never_contains_ai_weaknesses():
    subject, body = await compose_email(
        candidate_name="Nisha Sharma",
        company_name="ACME",
        job_title="Backend Engineer",
        application_status=ApplicationStatus.rejected,
        strengths=["Strong Python"],
        weaknesses=["Possible employment gap"],
    )
    assert "gap" not in body.lower()
    assert "Strong Python" not in body
    assert "Nisha" in body


def test_sanitizer_strips_active_content():
    dirty = (
        '<p onclick="x()">Hi</p><script>alert(1)</script>'
        '<img src=x onerror=alert(1)><a href="javascript:alert(1)">bad</a>'
        '<a href="https://cal.com/acme">Book</a>'
    )
    clean = sanitize_email_html(dirty)
    assert "<script" not in clean and "onerror" not in clean
    assert "onclick" not in clean and "javascript:" not in clean
    assert '<a href="https://cal.com/acme">Book</a>' in clean
    assert clean.startswith("<p>Hi</p>")


def test_background_url_keeps_real_password():
    engine = create_async_engine("postgresql+asyncpg://u:s3cret@localhost:5432/db")

    class FakeSession:
        bind = engine

    url = outreach_service._background_database_url(FakeSession())
    assert "s3cret" in url and "***" not in url


async def _seed(db, status=ApplicationStatus.applied, score=90):
    admin, company = await make_recruiter_admin(db)
    job = await make_active_job(
        db, company.id, status=JobStatus.expired, final_shortlist_completed=True
    )
    candidate, resume = await make_candidate_with_resume(db)
    app = await make_application(db, candidate.id, job.id, resume.id, status=status)
    app.score = score
    app.strengths = ["Good"]
    app.weaknesses = ["Bad"]
    await db.commit()
    return admin, company, job, app


async def test_prepare_drafts_does_not_decide_from_ai_score(client, db):
    admin, _, job, app = await _seed(db)
    resp = await client.post(
        f"/outreach/jobs/{job.id}/prepare-drafts",
        json={},
        headers=auth_headers(admin.id),
    )
    assert resp.status_code in (200, 201), resp.text
    assert resp.json()["data"]["drafts_count"] == 0
    row = await db.scalar(
        select(Application)
        .where(Application.id == app.id)
        .execution_options(populate_existing=True)
    )
    assert row.status == ApplicationStatus.applied


async def test_failed_send_is_not_marked_sent(client, db, monkeypatch):
    admin, _, _, app = await _seed(db, status=ApplicationStatus.rejected)
    draft = EmailDraft(application_id=app.id, subject="s", body="<p>b</p>")
    db.add(draft)
    await db.commit()

    async def boom(_draft):
        raise ConnectionError("smtp down")

    monkeypatch.setattr(outreach_service, "_send_single_draft", boom)
    resp = await client.post(
        f"/outreach/drafts/{draft.id}/approve",
        json={"approved": True},
        headers=auth_headers(admin.id),
    )
    assert resp.status_code == 502
    row = await db.scalar(
        select(EmailDraft)
        .where(EmailDraft.id == draft.id)
        .execution_options(populate_existing=True)
    )
    assert row.is_sent is False and row.sent_at is None

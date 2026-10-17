"""Public apply link: job page, CV prefill, no-account apply, status link,
withdraw + delete, passwordless sign-in, and recruiter source counts."""

import json
import re
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import func, select

from app.infrastructures.email.service import EmailService
from app.infrastructures.storage.service import storage_service
from app.modules.applications.models import Application
from app.modules.auth.models import User
from app.modules.public.models import MagicLinkToken
from app.modules.public.tokens import hash_magic_token
from app.modules.resumes.models import Resume
from app.shared.enums import JobStatus
from tests.integration.helpers import (
    auth_headers,
    make_active_job,
    make_recruiter_admin,
)


def make_pdf(*lines: str) -> bytes:
    """Smallest valid one-page PDF with the given text lines (Helvetica)."""
    ops = ["BT", "/F1 11 Tf", "50 760 Td", "14 TL"]
    for line in lines:
        safe = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        ops.append(f"({safe}) Tj T*")
    ops.append("ET")
    stream = "\n".join(ops).encode()
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for number, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += b"%d 0 obj\n" % number + body + b"\nendobj\n"
    xref = len(out)
    out += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objects) + 1)
    for offset in offsets:
        out += b"%010d 00000 n \n" % offset
    out += b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (
        len(objects) + 1,
        xref,
    )
    return bytes(out)


CV = make_pdf(
    "Sita Gurung",
    "Backend Engineer",
    "sita.gurung@example.com | +977 9812345678",
    "linkedin.com/in/sita-gurung  github.com/sitag",
    "5 years Python, FastAPI, PostgreSQL",
)


@pytest.fixture
def outbox(monkeypatch):
    """Capture emails and fake private uploads (no SMTP/S3 in tests)."""
    sent: list[dict] = []

    async def _send(to_email, subject, html_body):
        sent.append({"to": to_email, "subject": subject, "html": html_body})

    async def _upload(data, folder, *, extension, content_type):
        assert data.startswith(b"%PDF-") and content_type == "application/pdf"
        return f"private/{folder}/test.{extension}"

    async def _delete(_key):
        return None

    monkeypatch.setattr(EmailService, "send_generic_email", _send)
    monkeypatch.setattr(storage_service, "upload_private_document", _upload)
    monkeypatch.setattr(storage_service, "delete_key", _delete)
    return sent


def _token_from(html: str, param: str = "token") -> str:
    match = re.search(rf"[?&]{param}=([A-Za-z0-9._\-]+)", html)
    assert match, html
    return match.group(1)


async def _apply(client, slug, *, email="sita.gurung@example.com", **overrides):
    data = {
        "full_name": "Sita Gurung",
        "email": email,
        "consent": "true",
        "src": "linkedin",
        **overrides,
    }
    return await client.post(
        f"/public/jobs/{slug}/applications",
        data=data,
        files={"cv": ("cv.pdf", CV, "application/pdf")},
    )


class TestPublicPages:
    async def test_open_job_has_slug_and_public_page(self, client, db):
        _, company = await make_recruiter_admin(
            db, email="a1@test.com", company_name="F1Soft International Pvt. Ltd."
        )
        job = await make_active_job(
            db, company.id, title="Senior Backend Engineer (Python)"
        )
        assert re.fullmatch(
            r"senior-backend-engineer-python-f1soft-international-[a-z0-9]{4}",
            job.slug,
        )
        assert company.slug == "f1soft-international"

        resp = await client.get(f"/public/jobs/{job.slug}")
        assert resp.status_code == 200
        body = resp.json()["data"]
        assert body["title"] == "Senior Backend Engineer (Python)"
        assert body["company"]["slug"] == "f1soft-international"

    async def test_draft_closed_and_filled_jobs_are_404(self, client, db):
        _, company = await make_recruiter_admin(db, email="a2@test.com")
        draft = await make_active_job(db, company.id, status=JobStatus.draft)
        expired = await make_active_job(
            db,
            company.id,
            closes_at=datetime.now(timezone.utc) - timedelta(hours=1),
        )
        filled = await make_active_job(
            db, company.id, status=JobStatus.closed, closed_reason="hired"
        )
        for job in (draft, expired, filled):
            assert (await client.get(f"/public/jobs/{job.slug}")).status_code == 404

    async def test_careers_page_lists_only_open_jobs(self, client, db):
        _, company = await make_recruiter_admin(
            db, email="a3@test.com", company_name="Khalti Digital Wallet"
        )
        open_job = await make_active_job(db, company.id, title="QA Engineer")
        await make_active_job(db, company.id, status=JobStatus.draft)
        resp = await client.get(f"/public/companies/{company.slug}/jobs")
        assert resp.status_code == 200
        slugs = [j["slug"] for j in resp.json()["data"]["jobs"]]
        assert slugs == [open_job.slug]


class TestCvPrefill:
    async def test_reads_contact_details(self, client):
        resp = await client.post(
            "/public/cv-prefill", files={"cv": ("cv.pdf", CV, "application/pdf")}
        )
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["full_name"] == "Sita Gurung"
        assert data["email"] == "sita.gurung@example.com"
        assert data["phone"] == "+9779812345678"
        assert data["linkedin_url"] == "https://linkedin.com/in/sita-gurung"
        assert data["github_url"] == "https://github.com/sitag"

    async def test_rejects_non_pdf_even_with_pdf_name(self, client):
        resp = await client.post(
            "/public/cv-prefill",
            files={"cv": ("cv.pdf", b"<html>not a pdf</html>", "application/pdf")},
        )
        assert resp.status_code == 400


class TestGuestApply:
    async def test_apply_without_account(self, client, db, outbox):
        _, company = await make_recruiter_admin(db, email="a4@test.com")
        job = await make_active_job(
            db,
            company.id,
            questions=[
                {
                    "label": "Earliest start date?",
                    "type": "short_text",
                    "required": True,
                }
            ],
        )
        resp = await _apply(
            client,
            job.slug,
            email="Sita.Gurung@Example.com",
            phone="9812345678",
            answers=json.dumps(
                [{"question": "Earliest start date?", "answer": "Next month"}]
            ),
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()["data"]
        assert data["status_link_sent"] is True
        assert "token" not in json.dumps(data)

        user = await db.scalar(
            select(User).where(User.email == "sita.gurung@example.com")
        )
        assert user.password_hash is None
        assert user.is_email_verified is False

        application = await db.scalar(
            select(Application).where(Application.job_id == job.id)
        )
        assert application.source == "linkedin"
        assert application.consented_at is not None
        assert application.shared_full_name == "Sita Gurung"
        assert application.shared_phone_value == "+9779812345678"
        assert application.screening_answers == [
            {"question": "Earliest start date?", "answer": "Next month"}
        ]
        resume = await db.get(Resume, application.resume_id)
        assert resume.cv_file_key == "private/cvs/test.pdf"
        assert "FastAPI" in (resume.summary or "")

        assert len(outbox) == 1 and outbox[0]["to"] == "sita.gurung@example.com"
        assert "/applications/status?token=" in outbox[0]["html"]

    async def test_consent_is_required(self, client, db, outbox):
        _, company = await make_recruiter_admin(db, email="a5@test.com")
        job = await make_active_job(db, company.id)
        resp = await _apply(client, job.slug, consent="false")
        assert resp.status_code == 422
        assert outbox == []

    async def test_screening_questions_must_be_answered(self, client, db, outbox):
        _, company = await make_recruiter_admin(db, email="a6@test.com")
        job = await make_active_job(
            db,
            company.id,
            questions=[{"label": "Why us?", "type": "short_text", "required": True}],
        )
        resp = await _apply(client, job.slug)
        assert resp.status_code == 422

    async def test_second_apply_is_409_and_resends_link(self, client, db, outbox):
        _, company = await make_recruiter_admin(db, email="a7@test.com")
        job = await make_active_job(db, company.id)
        assert (await _apply(client, job.slug)).status_code == 201
        again = await _apply(client, job.slug)
        assert again.status_code == 409
        assert len(outbox) == 2 and "already applied" in outbox[1]["html"]
        count = await db.scalar(
            select(func.count(Application.id)).where(Application.job_id == job.id)
        )
        assert count == 1

    async def test_draft_job_rejects_applications(self, client, db, outbox):
        _, company = await make_recruiter_admin(db, email="a8@test.com")
        job = await make_active_job(db, company.id, status=JobStatus.draft)
        assert (await _apply(client, job.slug)).status_code == 404

    async def test_team_cannot_apply_to_own_business(self, client, db, outbox):
        _, company = await make_recruiter_admin(db, email="a9@test.com")
        job = await make_active_job(db, company.id)
        resp = await _apply(client, job.slug, email="a9@test.com")
        assert resp.status_code == 400

    async def test_per_email_rate_limit(self, client, db, outbox, monkeypatch):
        from app.core.config import settings

        monkeypatch.setattr(settings, "guest_applications_per_email_per_hour", 1)
        _, company = await make_recruiter_admin(db, email="a10@test.com")
        first = await make_active_job(db, company.id, title="Job One")
        second = await make_active_job(db, company.id, title="Job Two")
        assert (await _apply(client, first.slug)).status_code == 201
        assert (await _apply(client, second.slug)).status_code == 429

    async def test_flagged_cv_is_quarantined_not_blocked(self, client, db, outbox):
        from app.infrastructures.guardrails.service import GuardrailResult
        from app.modules.applications.models import Review
        from app.modules.review.reviewer import FakeReviewer
        from app.modules.review.service import review_application

        async def flag(_text, *, source, fail_closed=False):
            return GuardrailResult(safe=False, source=source, score=90, reason="x")

        _, company = await make_recruiter_admin(db, email="a11@test.com")
        job = await make_active_job(db, company.id, must_haves=["Python"])
        assert (await _apply(client, job.slug)).status_code == 201
        application = await db.scalar(
            select(Application).where(Application.job_id == job.id)
        )
        await review_application(
            application.id, db=db, reviewer=FakeReviewer(), guardrail=flag
        )
        review = await db.scalar(
            select(Review)
            .where(Review.application_id == application.id)
            .execution_options(populate_existing=True)
        )
        assert review.state == "needs_person" and review.fit is None
        await db.refresh(application)
        assert application.stage.value == "new"

    async def test_apply_with_phone_only_and_no_cv(self, client, db, outbox):
        _, company = await make_recruiter_admin(db, email="a12@test.com")
        job = await make_active_job(
            db,
            company.id,
            questions=[
                {
                    "label": "Do you have a driving licence?",
                    "type": "yes_no",
                    "required": True,
                    "knockout_answer": "yes",
                }
            ],
        )
        resp = await client.post(
            f"/public/jobs/{job.slug}/applications",
            data={
                "full_name": "राम बहादुर",
                "phone": "९८४१२३४५६७",
                "consent": "true",
                "answers": json.dumps(
                    [{"question": "Do you have a driving licence?", "answer": "छ"}]
                ),
            },
        )
        assert resp.status_code == 201, resp.text
        assert resp.json()["data"]["status_link_sent"] is False
        application = await db.scalar(
            select(Application).where(Application.job_id == job.id)
        )
        assert application.resume_id is None
        assert application.shared_phone_value == "+9779841234567"
        assert application.screening_answers == [
            {"question": "Do you have a driving licence?", "answer": "yes"}
        ]
        assert outbox == []

    async def test_phone_or_email_is_required(self, client, db, outbox):
        _, company = await make_recruiter_admin(db, email="a13@test.com")
        job = await make_active_job(db, company.id)
        resp = await client.post(
            f"/public/jobs/{job.slug}/applications",
            data={"full_name": "No Contact", "consent": "true"},
        )
        assert resp.status_code == 422

    async def test_referral_link_marks_the_source(self, client, db, outbox):
        from app.modules.jobs.models import JobReferrer

        _, company = await make_recruiter_admin(db, email="a14@test.com")
        job = await make_active_job(db, company.id)
        referrer = JobReferrer(job_id=job.id, name="Sita didi", token="sitadidi01")
        db.add(referrer)
        await db.flush()
        assert (await _apply(client, job.slug, ref="sitadidi01")).status_code == 201
        application = await db.scalar(
            select(Application).where(Application.job_id == job.id)
        )
        assert application.source == "referral"
        assert application.referrer_id == referrer.id


class TestStatusAndWithdraw:
    async def test_status_then_withdraw_deletes_guest_data(self, client, db, outbox):
        _, company = await make_recruiter_admin(db, email="b1@test.com")
        job = await make_active_job(db, company.id)
        assert (await _apply(client, job.slug)).status_code == 201
        token = _token_from(outbox[0]["html"])

        status_resp = await client.get(
            "/public/applications/status", params={"token": token}
        )
        assert status_resp.status_code == 200
        view = status_resp.json()["data"]
        assert view["status_label"] == "Applied"
        assert view["can_withdraw"] is True
        assert "score" not in view and "ai_review_status" not in view

        withdraw = await client.post(
            "/public/applications/withdraw", json={"token": token}
        )
        assert withdraw.status_code == 200
        assert withdraw.json()["data"] == {"withdrawn": True, "data_deleted": True}
        assert (
            await db.scalar(select(User).where(User.email == "sita.gurung@example.com"))
            is None
        )
        gone = await client.get("/public/applications/status", params={"token": token})
        assert gone.status_code == 404

    async def test_garbage_token_is_404(self, client):
        resp = await client.get(
            "/public/applications/status", params={"token": "not-a-real-token-123"}
        )
        assert resp.status_code == 404


class TestMagicLink:
    async def test_same_response_for_unknown_and_known_email(self, client, db, outbox):
        await make_recruiter_admin(db, email="rec@test.com")
        for email in ("nobody@example.com", "rec@test.com"):
            resp = await client.post("/public/auth/magic-link", json={"email": email})
            assert resp.status_code == 200
            assert resp.json()["data"] == {"sent": True}
        # Everyone is a person: a business owner can also sign in by link.
        assert [m["to"] for m in outbox] == ["nobody@example.com", "rec@test.com"]

    async def test_link_signs_in_once_and_links_guest_applications(
        self, client, db, outbox
    ):
        _, company = await make_recruiter_admin(db, email="b2@test.com")
        job = await make_active_job(db, company.id)
        assert (await _apply(client, job.slug)).status_code == 201

        await client.post(
            "/public/auth/magic-link", json={"email": "sita.gurung@example.com"}
        )
        token = _token_from(outbox[-1]["html"])

        opened = await client.get(
            "/public/auth/magic", params={"token": token}, follow_redirects=False
        )
        assert opened.status_code == 303
        assert opened.headers["location"].endswith("/me/applications")
        assert "refresh_token=" in opened.headers.get("set-cookie", "")

        reused = await client.get(
            "/public/auth/magic", params={"token": token}, follow_redirects=False
        )
        assert "error=link_invalid" in reused.headers["location"]

        user = await db.scalar(
            select(User).where(User.email == "sita.gurung@example.com")
        )
        assert user.is_email_verified is True
        mine = await client.get("/me/applications", headers=auth_headers(user.id))
        assert mine.status_code == 200
        items = mine.json()["data"]
        assert [i["job_slug"] for i in items] == [job.slug]
        assert items[0]["status_label"] == "Applied"

    async def test_expired_link_is_rejected(self, client, db):
        db.add(
            MagicLinkToken(
                email="late@example.com",
                token_hash=hash_magic_token("expired-token-value"),
                expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
            )
        )
        await db.flush()
        resp = await client.get(
            "/public/auth/magic",
            params={"token": "expired-token-value"},
            follow_redirects=False,
        )
        assert "error=link_invalid" in resp.headers["location"]

    async def test_magic_link_is_rate_limited_per_email(self, client, db, outbox):
        for _ in range(5):
            await client.post(
                "/public/auth/magic-link", json={"email": "many@example.com"}
            )
        assert len(outbox) == 3


class TestRecruiterSide:
    async def test_source_counts_only_for_company_members(self, client, db, outbox):
        admin, company = await make_recruiter_admin(db, email="b3@test.com")
        job = await make_active_job(db, company.id)
        assert (await _apply(client, job.slug, src="facebook")).status_code == 201

        member = await client.get(f"/jobs/{job.id}", headers=auth_headers(admin.id))
        assert member.json()["data"]["source_counts"] == {"facebook": 1}
        assert member.json()["data"]["slug"] == job.slug

        anonymous = await client.get(f"/jobs/{job.id}")
        assert anonymous.json()["data"]["source_counts"] is None

        pipeline = await client.get(
            f"/recruiter/v2/jobs/{job.id}/pipeline", headers=auth_headers(admin.id)
        )
        assert pipeline.json()["data"]["items"][0]["source"] == "facebook"

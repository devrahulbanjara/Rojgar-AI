import hashlib
import hmac
import json

import pytest
from sqlalchemy import select

from app.core.config import settings
from app.modules.interviews.models import Interview
from app.shared.enums import ApplicationStatus
from tests.integration.helpers import (
    make_active_job,
    make_application,
    make_candidate_with_resume,
    make_recruiter_admin,
)

URL = "/webhook/cal/interview-booking"
SECRET = "test-cal-secret"


def _payload(organizer: str, attendee: str, uid: str = "booking-1") -> bytes:
    return json.dumps(
        {
            "triggerEvent": "BOOKING_CREATED",
            "startTime": "2030-01-01T10:00:00Z",
            "endTime": "2030-01-01T10:30:00Z",
            "location": "https://meet.example.com/abc",
            "uid": uid,
            "organizer.email": organizer,
            "attendees.0.email": attendee,
            "attendees.0.name": "Cand",
        }
    ).encode()


def _sign(body: bytes, secret: str = SECRET) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


@pytest.fixture
def cal_secret(monkeypatch):
    monkeypatch.setattr(settings, "cal_webhook_secret", SECRET)


async def _shortlisted(db):
    _, company = await make_recruiter_admin(db, email="cal_admin@example.com")
    company.cal_organizer_email = "hiring@acme-hiring.com"
    job = await make_active_job(db, company.id)
    user, resume = await make_candidate_with_resume(db, email="cal_cand@example.com")
    application = await make_application(
        db, user.id, job.id, resume.id, status=ApplicationStatus.shortlisted
    )
    await db.flush()
    return application


class TestCalWebhookSignature:
    async def test_missing_signature_rejected(self, client, db, cal_secret):
        application = await _shortlisted(db)
        body = _payload("hiring@acme-hiring.com", "cal_cand@example.com")

        resp = await client.post(
            URL, content=body, headers={"Content-Type": "application/json"}
        )

        assert resp.status_code == 401
        assert (
            await db.scalar(
                select(Interview).where(Interview.application_id == application.id)
            )
            is None
        )

    async def test_wrong_signature_rejected(self, client, db, cal_secret):
        await _shortlisted(db)
        body = _payload("hiring@acme-hiring.com", "cal_cand@example.com")

        resp = await client.post(
            URL,
            content=body,
            headers={
                "Content-Type": "application/json",
                "X-Cal-Signature-256": _sign(body, "attacker-guess"),
            },
        )

        assert resp.status_code == 401

    async def test_valid_signature_books_interview(self, client, db, cal_secret):
        application = await _shortlisted(db)
        body = _payload("hiring@acme-hiring.com", "cal_cand@example.com")

        resp = await client.post(
            URL,
            content=body,
            headers={
                "Content-Type": "application/json",
                "X-Cal-Signature-256": _sign(body),
            },
        )

        assert resp.status_code == 200
        await db.refresh(application)
        assert application.status == ApplicationStatus.interview_booked

    async def test_misses_are_indistinguishable(self, client, db, cal_secret):
        await _shortlisted(db)
        responses = []
        for organizer, attendee in [
            ("nobody@nowhere-corp.com", "cal_cand@example.com"),
            ("hiring@acme-hiring.com", "stranger@example.com"),
        ]:
            body = _payload(organizer, attendee)
            resp = await client.post(
                URL,
                content=body,
                headers={
                    "Content-Type": "application/json",
                    "X-Cal-Signature-256": _sign(body),
                },
            )
            responses.append((resp.status_code, resp.json()))

        assert responses[0] == responses[1]

    async def test_prod_without_secret_rejected(self, client, db, monkeypatch):
        monkeypatch.setattr(settings, "cal_webhook_secret", None)
        monkeypatch.setattr(settings, "environment", "prod")
        body = _payload("hiring@acme-hiring.com", "cal_cand@example.com")

        resp = await client.post(
            URL, content=body, headers={"Content-Type": "application/json"}
        )

        assert resp.status_code == 503

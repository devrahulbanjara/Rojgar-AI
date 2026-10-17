"""SMS off (the free setup): no texts, no phone codes, the status link still shows."""

import pytest

from app.core.config import settings
from app.infrastructures.sms.service import get_sms_provider, send_sms


@pytest.fixture
def sms_off(monkeypatch):
    monkeypatch.setattr(settings, "sms_enabled", False)


async def test_options_say_which_sign_in_works(client, sms_off):
    resp = await client.get("/auth/options")
    assert resp.status_code == 200
    assert resp.json()["data"] == {
        "sms": False,
        "google": True,
        "email_link": True,
        "password": True,
    }


async def test_phone_codes_are_refused(client, sms_off):
    before = len(get_sms_provider().sent)
    for path, body in [
        ("/auth/otp/request", {"phone": "9812345678"}),
        ("/auth/otp/verify", {"phone": "9812345678", "code": "123456"}),
    ]:
        resp = await client.post(path, json=body)
        assert resp.status_code == 404
        assert resp.json()["message"] == (
            "Phone codes are not available. Use Google or email."
        )
    assert len(get_sms_provider().sent) == before


async def test_nothing_is_sent(sms_off):
    before = len(get_sms_provider().sent)
    assert await send_sms("9812345678", "hello") is False
    assert len(get_sms_provider().sent) == before


async def test_sms_needs_sparrow_and_a_token_in_prod(monkeypatch):
    from app.infrastructures.sms.service import sms_available

    monkeypatch.setattr(settings, "environment", "prod")
    monkeypatch.setattr(settings, "sms_provider", "console")
    assert sms_available() is False
    monkeypatch.setattr(settings, "sms_provider", "sparrow")
    monkeypatch.setattr(settings, "sparrow_sms_token", None)
    assert sms_available() is False
    monkeypatch.setattr(settings, "sparrow_sms_token", "token")
    assert sms_available() is True


async def test_phone_only_applicant_gets_the_status_link_on_screen(
    client, db, sms_off, monkeypatch
):
    from app.infrastructures.email.service import EmailService
    from tests.integration.helpers import make_active_job, make_recruiter_admin

    emails: list[str] = []

    async def _send(to_email, _subject, _html):
        emails.append(to_email)

    monkeypatch.setattr(EmailService, "send_generic_email", _send)
    _, company = await make_recruiter_admin(db, email="smsoff@test.com")
    job = await make_active_job(db, company.id)
    before = len(get_sms_provider().sent)

    resp = await client.post(
        f"/public/jobs/{job.slug}/applications",
        data={
            "full_name": "Sita Gurung",
            "phone": "9812345678",
            "consent": "true",
            "src": "linkedin",
        },
    )

    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]
    assert data["status_link_sent"] is False
    assert "/applications/status?token=" in data["status_url"]
    assert len(get_sms_provider().sent) == before and emails == []

    again = await client.post(
        f"/public/jobs/{job.slug}/applications",
        data={"full_name": "Sita Gurung", "phone": "9812345678", "consent": "true"},
    )
    assert again.status_code == 409
    assert again.json()["message"] == "You've already applied to this job."

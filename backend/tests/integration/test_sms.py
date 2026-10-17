"""SMS channel: number handling, segment maths, templates, console provider."""

from datetime import datetime, timezone

from app.core.config import settings
from app.infrastructures.sms import service as sms
from app.modules.notifications.sms import render_sms, sms_candidate, sms_when


def test_normalize_nepali_mobile():
    assert sms.normalize_np_mobile("+977 980-1234567") == "9801234567"
    assert sms.normalize_np_mobile("9851234567") == "9851234567"
    assert sms.normalize_np_mobile("01-4412345") is None  # landline
    assert sms.normalize_np_mobile(None) is None


def test_segments():
    assert sms.sms_segments("a" * 160) == 1
    assert sms.sms_segments("a" * 161) == 2
    assert sms.sms_segments("क" * 70) == 1
    assert sms.sms_segments("क" * 71) == 2


def test_templates_nepali_by_default_and_short(monkeypatch):
    monkeypatch.setattr(settings, "sms_language", "ne")
    text = render_sms("received", company="Acme", job="Backend Engineer")
    assert "आवेदन" in text
    assert sms.sms_segments(text) == 1

    when = sms_when(datetime(2026, 10, 20, 4, 45, tzinfo=timezone.utc))
    assert when == "Tue 20 Oct 10:30"
    booked = render_sms(
        "interview_booked", company="Acme", when=when, link="https://meet.jit.si/x"
    )
    assert sms.sms_segments(booked) <= 2

    monkeypatch.setattr(settings, "sms_language", "en")
    assert render_sms("closed", company="Acme", job="Dev").startswith(
        "Acme: hiring for Dev"
    )


def test_long_nepali_falls_back_to_english(monkeypatch):
    monkeypatch.setattr(settings, "sms_language", "ne")
    url = "https://rojgarai.com/schedule/" + "x" * 200
    text = render_sms("shortlisted", company="Acme", job="Dev", url=url)
    assert text.startswith("Acme: you're shortlisted")


async def test_console_provider_outside_prod(monkeypatch):
    monkeypatch.setattr(settings, "sms_provider", "sparrow")
    monkeypatch.setattr(settings, "sparrow_sms_token", "secret")
    provider = sms.get_sms_provider()
    assert isinstance(provider, sms.ConsoleSmsProvider)

    before = len(provider.sent)
    assert await sms_candidate("+9779801234567", "received", company="A", job="B")
    assert provider.sent[before][0] == "9801234567"
    assert not await sms_candidate("12345", "received", company="A", job="B")

"""Short candidate SMS for each step of an application.

Nepali by default; English is used when ``SMS_LANGUAGE=en`` or when the Nepali
text would take more than 3 SMS segments (Nepali counts 70 chars a segment,
English 160). Send only for jobs with the ``sms`` feature (entitlements).

Hooks for other modules (B1): ``received`` after an application is stored,
``closed`` when a job closes; ``shortlisted`` is sent by the interview invite.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from zoneinfo import ZoneInfo

from app.core.config import settings
from app.infrastructures.sms.service import send_sms, sms_segments

SmsEvent = Literal[
    "received",
    "shortlisted",
    "interview_booked",
    "interview_rescheduled",
    "interview_reminder",
    "interview_cancelled",
    "closed",
]

_TEMPLATES: dict[SmsEvent, dict[str, str]] = {
    "received": {
        "ne": "{company}: {job} को आवेदन प्राप्त भयो। धन्यवाद!",
        "en": "{company}: we got your application for {job}. Thank you!",
    },
    "shortlisted": {
        "ne": "{company}: {job} मा अन्तर्वार्ताको लागि छानिनुभयो। समय रोज्नुहोस्: {url}",
        "en": "{company}: you're shortlisted for {job}. Pick an interview time: {url}",
    },
    "interview_booked": {
        "ne": "{company}: अन्तर्वार्ता {when}। {link}",
        "en": "{company}: interview on {when}. {link}",
    },
    "interview_rescheduled": {
        "ne": "{company}: अन्तर्वार्ता सारियो, नयाँ समय {when}। {link}",
        "en": "{company}: interview moved to {when}. {link}",
    },
    "interview_reminder": {
        "ne": "सम्झना: {company} सँग अन्तर्वार्ता {when}। {link}",
        "en": "Reminder: interview with {company} on {when}. {link}",
    },
    "interview_cancelled": {
        "ne": "{company}: अन्तर्वार्ता रद्द भयो। नयाँ समय रोज्न: {url}",
        "en": "{company}: interview cancelled. Pick a new time: {url}",
    },
    "closed": {
        "ne": "{company}: {job} को भर्ना बन्द भयो। आवेदनको लागि धन्यवाद।",
        "en": "{company}: hiring for {job} has closed. Thank you for applying.",
    },
}

_MAX_NEPALI_SEGMENTS = 3


def sms_when(at: datetime, tz: str = "Asia/Kathmandu") -> str:
    """Compact local time, e.g. "Mon 20 Oct 10:30"."""
    return at.astimezone(ZoneInfo(tz)).strftime("%a %d %b %H:%M")


def render_sms(event: SmsEvent, **ctx: str) -> str:
    """Candidate text for ``event``; titles are cut so the SMS stays short."""
    ctx = {k: (v[:40] if k in {"company", "job"} else v) for k, v in ctx.items()}
    templates = _TEMPLATES[event]
    if settings.sms_language == "ne":
        text = templates["ne"].format(**ctx)
        if sms_segments(text) <= _MAX_NEPALI_SEGMENTS:
            return text
    return templates["en"].format(**ctx)


async def sms_candidate(phone: str | None, event: SmsEvent, **ctx: str) -> bool:
    """Text a candidate (no-op without a valid Nepali mobile). Never raises."""
    if not phone:
        return False
    return await send_sms(phone, render_sms(event, **ctx))

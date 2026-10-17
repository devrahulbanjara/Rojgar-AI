"""Short texts to applicants and suggested people.

``notify_applicant`` is the one entry point the public module uses. The SMS
provider sits behind ``SmsSender`` so it can be swapped; until the SMS channel
lands (wave/b2: app.infrastructures.sms.service.send_sms), the default sender
only logs the text. Texts are Nepali, with English when long names would push
the Nepali past two SMS.
"""

from __future__ import annotations

from typing import Literal, Protocol

from loguru import logger

NotifyEvent = Literal["received", "suggested"]

_TEXTS: dict[NotifyEvent, dict[str, str]] = {
    "received": {
        "ne": "{company}: {job} को आवेदन पायौं। खबर यहाँ: {url}",
        "en": "{company}: we got your application for {job}. Status: {url}",
    },
    "suggested": {
        "ne": "{referrer} ले तपाईंलाई {company} को {job} जागिरको लागि सुझाउनुभयो। आवेदन: {url}",
        "en": "{referrer} suggested you for {job} at {company}. Apply: {url}",
    },
}
# Unicode SMS: 67 chars a part. Two parts, minus the link.
_MAX_NEPALI_CHARS = 134


class SmsSender(Protocol):
    async def __call__(self, phone: str, text: str) -> bool: ...


async def _log_only(phone: str, text: str) -> bool:
    logger.info("SMS (not sent, no provider yet) to {}: {}", phone, text)
    return False


sender: SmsSender = _log_only


def render(event: NotifyEvent, **ctx: str) -> str:
    """Applicant text; names are cut so it stays one or two SMS."""
    ctx = {k: v if k == "url" else v[:40] for k, v in ctx.items()}
    text = _TEXTS[event]["ne"].format(**ctx)
    if len(text) - len(ctx.get("url", "")) <= _MAX_NEPALI_CHARS - 60:
        return text
    return _TEXTS[event]["en"].format(**ctx)


async def notify_applicant(phone: str | None, event: NotifyEvent, **ctx: str) -> bool:
    """Text an applicant or suggested person. Never raises."""
    if not phone:
        return False
    try:
        return await sender(phone, render(event, **ctx))
    except Exception as exc:  # an SMS failure must never fail the request
        logger.warning("SMS {} to {} failed: {}", event, phone, exc)
        return False

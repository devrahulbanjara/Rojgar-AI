"""SMS channel: ``send_sms(phone, text)`` behind a swappable provider.

Off unless ``SMS_ENABLED=true`` (SMS costs money): ``send_sms`` then returns
False without a word, and callers fall back to email. When on, prod uses
``sparrow`` (Sparrow SMS, Nepal) and every other environment ``console`` (logs
only), so local runs and tests never send a real SMS. A Viber/WhatsApp
provider can be added with the same ``send`` signature.
"""

from __future__ import annotations

import re
from typing import Protocol

import httpx
from loguru import logger

from app.core.config import settings

SPARROW_URL = "https://api.sparrowsms.com/v2/sms/"

# GSM 03.38 basic character set (a message using only these fits 160 chars).
_GSM_CHARS = set(
    "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?"
    "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"
)
_GSM_EXT = set("^{}\\[~]|€")


def is_gsm(text: str) -> bool:
    return all(c in _GSM_CHARS or c in _GSM_EXT for c in text)


def sms_segments(text: str) -> int:
    """Billable segments: GSM 160/153 chars, Unicode (e.g. Nepali) 70/67."""
    if is_gsm(text):
        length = sum(2 if c in _GSM_EXT else 1 for c in text)
        single, multi = 160, 153
    else:
        length = len(text)
        single, multi = 70, 67
    if length <= single:
        return 1
    return -(-length // multi)


def normalize_np_mobile(phone: str | None) -> str | None:
    """10-digit Nepali mobile number (98XXXXXXXX), or None if it is not one."""
    if not phone:
        return None
    digits = re.sub(r"\D", "", phone)
    if digits.startswith("977") and len(digits) == 13:
        digits = digits[3:]
    return digits if re.fullmatch(r"9[678]\d{8}", digits) else None


class SmsProvider(Protocol):
    async def send(self, to: str, text: str) -> bool: ...


class ConsoleSmsProvider:
    """Logs instead of sending. Tests read ``sent``."""

    def __init__(self) -> None:
        self.sent: list[tuple[str, str]] = []

    async def send(self, to: str, text: str) -> bool:
        self.sent.append((to, text))
        logger.info("SMS (not sent) to {}: {}", to, text)
        return True


class SparrowSmsProvider:
    def __init__(self, token: str, sender: str) -> None:
        self._token = token
        self._sender = sender

    async def send(self, to: str, text: str) -> bool:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    SPARROW_URL,
                    data={
                        "token": self._token,
                        "from": self._sender,
                        "to": to,
                        "text": text,
                    },
                )
            if resp.status_code == 200:
                return True
            logger.warning(
                "Sparrow SMS failed ({}): {}", resp.status_code, resp.text[:200]
            )
        except httpx.HTTPError as exc:
            logger.warning("Sparrow SMS error: {}", type(exc).__name__)
        return False


_console = ConsoleSmsProvider()


def _sparrow_ready() -> bool:
    return settings.sms_provider == "sparrow" and bool(settings.sparrow_sms_token)


def sms_available() -> bool:
    """True when texts can actually reach people (phone codes, updates)."""
    if not settings.sms_enabled:
        return False
    return settings.environment != "prod" or _sparrow_ready()


def get_sms_provider() -> SmsProvider:
    if settings.environment == "prod" and _sparrow_ready():
        return SparrowSmsProvider(settings.sparrow_sms_token, settings.sparrow_sms_from)
    return _console


async def send_sms(phone: str | None, text: str) -> bool:
    """Send one SMS to a Nepali mobile number. Never raises.

    False when SMS is off or the number is not a Nepali mobile.
    """
    if not sms_available():
        return False
    to = normalize_np_mobile(phone)
    if to is None:
        return False
    return await get_sms_provider().send(to, text)

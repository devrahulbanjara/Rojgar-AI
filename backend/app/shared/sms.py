"""Minimal SMS sender until the SMS channel (wave B2) is merged.

Same call as ``app.infrastructures.sms.service.send_sms(phone, text)``:
swap the import there and delete this file. It only logs, so local runs and
tests never send a real SMS; ``sent`` lets tests read what would have gone out.
"""

from loguru import logger

sent: list[tuple[str, str]] = []


async def send_sms(phone: str | None, text: str) -> bool:
    """Send one SMS. Never raises."""
    if not phone:
        return False
    sent.append((phone, text))
    logger.info("SMS (not sent) to {}: {}", phone, text)
    return True

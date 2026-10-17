"""Candidate SMS, used when someone is recommended without an email.

TODO(B2): B2 owns SMS sending. Replace this stub with B2's notify helper once
it is merged; until then messages are logged and reported as not sent.
"""

from loguru import logger


async def send_sms(phone: str, text: str) -> bool:
    """Send one SMS. Returns True only when a provider accepted it."""
    logger.info("SMS not sent (no provider yet) to {}: {}", phone[:-4] + "****", text)
    return False

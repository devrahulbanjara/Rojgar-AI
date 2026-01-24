from datetime import datetime
from zoneinfo import ZoneInfo

from .config import settings


def get_datetime():
    """
    Get current datetime in the configured timezone without timezone info.
    Returns a naive datetime object suitable for database storage.

    Usage:
        from app.core import get_datetime

        # Get current datetime
        now = get_datetime()

        # Convert to string if needed
        now_str = str(now)
        # or with custom format
        now_formatted = now.strftime("%Y-%m-%d %H:%M:%S")
    """
    now = datetime.now(ZoneInfo(settings.TIMEZONE))
    return now.replace(tzinfo=None)

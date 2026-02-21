from datetime import date, datetime
from zoneinfo import ZoneInfo

from .config import settings


def get_datetime():
    now = datetime.now(ZoneInfo(settings.TIMEZONE))
    return now.replace(tzinfo=None)


def get_datetime_tz() -> datetime:
    """Returns timezone-aware datetime for Nepal"""
    return datetime.now(ZoneInfo(settings.TIMEZONE))


def get_today() -> date:
    """Returns current date in Nepal timezone"""
    return datetime.now(ZoneInfo(settings.TIMEZONE)).date()

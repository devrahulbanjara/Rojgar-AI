from datetime import datetime
from zoneinfo import ZoneInfo

from .config import settings


def get_datetime():
    now = datetime.now(ZoneInfo(settings.TIMEZONE))
    return now.replace(tzinfo=None)

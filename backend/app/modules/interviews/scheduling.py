"""Pure scheduling helpers: open slots, scheduling-link tokens, iCalendar."""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from typing import Literal
from zoneinfo import ZoneInfo

from app.core.config import settings

WEEKDAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")  # date.weekday()
WORKING_DAYS_AHEAD = 10
MIN_NOTICE = timedelta(hours=2)


# --- meeting links -----------------------------------------------------------


def jitsi_link() -> str:
    """A fresh Jitsi room: no account needed on either side."""
    return f"https://meet.jit.si/rojgarai-{secrets.token_hex(8)}"


# --- scheduling-link tokens --------------------------------------------------


def _mac(raw: bytes) -> bytes:
    key = settings.secret_key.encode()
    return hmac.new(key, b"interview-schedule:" + raw, hashlib.sha256).digest()[:10]


def make_token(invite_id: uuid.UUID) -> str:
    """Short signed token (35 chars) so the link also fits in an SMS."""
    raw = invite_id.bytes
    return base64.urlsafe_b64encode(raw + _mac(raw)).rstrip(b"=").decode()


def read_token(token: str) -> uuid.UUID | None:
    try:
        data = base64.urlsafe_b64decode(token + "=" * (-len(token) % 4))
    except ValueError:
        return None
    raw, mac = data[:16], data[16:]
    if len(raw) != 16 or not hmac.compare_digest(mac, _mac(raw)):
        return None
    return uuid.UUID(bytes=raw)


def scheduling_url(token: str) -> str:
    return f"{settings.frontend_url}/schedule/{token}"


# --- slots -------------------------------------------------------------------


@dataclass(frozen=True)
class Slot:
    start: datetime
    end: datetime


def _parse_hhmm(value: str) -> time:
    hours, minutes = value.split(":")
    return time(int(hours), int(minutes))


def working_days(
    weekly_hours: dict[str, list[list[str]]], first: date, count: int
) -> list[date]:
    """The next ``count`` dates (from ``first``) that have working hours."""
    days: list[date] = []
    day = first
    for _ in range(count * 7):  # bounded even if no day has hours
        if weekly_hours.get(WEEKDAYS[day.weekday()]):
            days.append(day)
            if len(days) == count:
                break
        day += timedelta(days=1)
    return days


def open_slots(
    *,
    weekly_hours: dict[str, list[list[str]]],
    tz: str,
    interview_minutes: int,
    buffer_minutes: int,
    busy: list[tuple[datetime, datetime]],
    now: datetime,
    days_ahead: int = WORKING_DAYS_AHEAD,
) -> list[Slot]:
    """Free interview slots over the next ``days_ahead`` working days.

    Slots start at each window's start and repeat every interview length +
    buffer. A slot is dropped if it starts within ``MIN_NOTICE`` or comes
    within ``buffer_minutes`` of a busy interval.
    """
    zone = ZoneInfo(tz)
    length = timedelta(minutes=interview_minutes)
    buffer = timedelta(minutes=buffer_minutes)
    earliest = now + MIN_NOTICE
    slots: list[Slot] = []
    for day in working_days(weekly_hours, now.astimezone(zone).date(), days_ahead):
        for window_start, window_end in weekly_hours[WEEKDAYS[day.weekday()]]:
            start = datetime.combine(day, _parse_hhmm(window_start), zone)
            close = datetime.combine(day, _parse_hhmm(window_end), zone)
            while start + length <= close:
                end = start + length
                clashes = any(
                    start < b_end + buffer and b_start < end + buffer
                    for b_start, b_end in busy
                )
                if start >= earliest and not clashes:
                    slots.append(Slot(start, end))
                start = end + buffer
    return slots


# --- iCalendar (RFC 5545) ----------------------------------------------------


def _escape(value: str) -> str:
    return (
        value.replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\r\n", "\\n")
        .replace("\n", "\\n")
    )


def _fold(line: str) -> str:
    """Fold a content line at 75 octets without splitting a UTF-8 character."""
    out, current = [], ""
    for char in line:
        limit = 75 if not out else 74  # continuation lines start with a space
        if len((current + char).encode()) > limit:
            out.append(current)
            current = char
        else:
            current += char
    out.append(current)
    return "\r\n ".join(out)


def _cn(name: str) -> str:
    """Display name safe inside a quoted iCalendar parameter."""
    return name.replace('"', "'").replace("\n", " ")[:100]


def _utc(at: datetime) -> str:
    return at.astimezone(UTC).strftime("%Y%m%dT%H%M%SZ")


def _local(at: datetime, zone: ZoneInfo) -> str:
    return at.astimezone(zone).strftime("%Y%m%dT%H%M%S")


def _offset(at: datetime, zone: ZoneInfo) -> str:
    seconds = int(at.astimezone(zone).utcoffset().total_seconds())
    sign = "+" if seconds >= 0 else "-"
    hours, minutes = divmod(abs(seconds) // 60, 60)
    return f"{sign}{hours:02d}{minutes:02d}"


def build_ics(
    *,
    method: Literal["REQUEST", "CANCEL"],
    uid: str,
    sequence: int,
    start: datetime,
    end: datetime,
    tz: str,
    summary: str,
    description: str,
    location: str,
    organizer: tuple[str, str],
    attendees: list[tuple[str, str]],
    now: datetime | None = None,
) -> str:
    """An invite (REQUEST) or cancellation (CANCEL) that Google and Outlook accept."""
    zone = ZoneInfo(tz)
    offset = _offset(start, zone)
    org_name, org_email = organizer
    lines = [
        "BEGIN:VCALENDAR",
        "PRODID:-//Rojgar AI//Interviews//EN",
        "VERSION:2.0",
        "CALSCALE:GREGORIAN",
        f"METHOD:{method}",
        "BEGIN:VTIMEZONE",
        f"TZID:{tz}",
        "BEGIN:STANDARD",
        "DTSTART:19700101T000000",
        f"TZOFFSETFROM:{offset}",
        f"TZOFFSETTO:{offset}",
        f"TZNAME:{offset}",
        "END:STANDARD",
        "END:VTIMEZONE",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"SEQUENCE:{sequence}",
        f"DTSTAMP:{_utc(now or datetime.now(UTC))}",
        f"DTSTART;TZID={tz}:{_local(start, zone)}",
        f"DTEND;TZID={tz}:{_local(end, zone)}",
        f"SUMMARY:{_escape(summary)}",
        f"DESCRIPTION:{_escape(description)}",
        f"LOCATION:{_escape(location)}",
        f"URL:{location}",
        f'ORGANIZER;CN="{_cn(org_name)}":mailto:{org_email}',
    ]
    for name, email in attendees:
        lines.append(
            "ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;"
            f'RSVP=TRUE;CN="{_cn(name)}":mailto:{email}'
        )
    lines += [
        f"STATUS:{'CANCELLED' if method == 'CANCEL' else 'CONFIRMED'}",
        "TRANSP:OPAQUE",
    ]
    if method == "REQUEST":
        lines += [
            "BEGIN:VALARM",
            "ACTION:DISPLAY",
            "DESCRIPTION:Interview",
            "TRIGGER:-PT15M",
            "END:VALARM",
        ]
    lines += ["END:VEVENT", "END:VCALENDAR"]
    return "\r\n".join(_fold(line) for line in lines) + "\r\n"

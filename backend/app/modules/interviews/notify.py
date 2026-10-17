"""Emails (with .ics) and SMS about interviews. Runs after the commit.

Every function takes a plain ``InterviewMessage`` snapshot, so sending never
holds a database connection and a failed send never undoes a booking.
"""

from __future__ import annotations

import html
from dataclasses import dataclass
from datetime import datetime
from typing import Literal
from zoneinfo import ZoneInfo

from app.core.config import settings
from app.infrastructures.email.service import EmailService
from app.modules.interviews.scheduling import build_ics
from app.modules.notifications.sms import sms_candidate, sms_when

Change = Literal["booked", "rescheduled", "cancelled"]


@dataclass(frozen=True)
class InterviewMessage:
    company_name: str
    job_title: str
    candidate_name: str
    candidate_email: str | None
    candidate_phone: str | None
    interviewer_name: str
    interviewer_email: str | None
    scheduling_url: str
    sms_enabled: bool
    # Unset for invites (nothing booked yet).
    uid: str | None = None
    sequence: int = 0
    start: datetime | None = None
    end: datetime | None = None
    timezone: str = "Asia/Kathmandu"
    meeting_link: str | None = None


def _when(msg: InterviewMessage) -> str:
    """e.g. "Tuesday 20 October, 10:30-11:15 (Asia/Kathmandu)"."""
    zone = ZoneInfo(msg.timezone)
    start, end = msg.start.astimezone(zone), msg.end.astimezone(zone)
    return f"{start:%A %d %B, %H:%M}-{end:%H:%M} ({msg.timezone})"


def _p(text: str) -> str:
    return f"<p>{html.escape(text)}</p>"


def _link(url: str, label: str) -> str:
    return f'<p><a href="{html.escape(url, quote=True)}">{html.escape(label)}</a></p>'


def _summary(msg: InterviewMessage) -> str:
    return f"Interview: {msg.candidate_name} / {msg.job_title} ({msg.company_name})"


def _ics(msg: InterviewMessage, method: Literal["REQUEST", "CANCEL"]) -> str:
    attendees = [(msg.candidate_name, msg.candidate_email)]
    if msg.interviewer_email:
        attendees.append((msg.interviewer_name, msg.interviewer_email))
    return build_ics(
        method=method,
        uid=msg.uid,
        sequence=msg.sequence,
        start=msg.start,
        end=msg.end,
        tz=msg.timezone,
        summary=_summary(msg),
        description=(
            f"Join: {msg.meeting_link}\nReschedule or cancel: {msg.scheduling_url}"
        ),
        location=msg.meeting_link or "",
        organizer=(settings.product_name, settings.mail_from),
        attendees=[(n, e) for n, e in attendees if e],
    )


async def send_invite(msg: InterviewMessage) -> None:
    """Ask a shortlisted candidate to pick a time."""
    if msg.candidate_email:
        body = (
            _p(f"Hi {msg.candidate_name},")
            + _p(
                f"{msg.company_name} would like to interview you for "
                f"{msg.job_title}. Pick a time that suits you:"
            )
            + _link(msg.scheduling_url, "Choose an interview time")
        )
        await EmailService.send_generic_email(
            msg.candidate_email, f"Interview for {msg.job_title}: pick a time", body
        )
    if msg.sms_enabled:
        await sms_candidate(
            msg.candidate_phone,
            "shortlisted",
            company=msg.company_name,
            job=msg.job_title,
            url=msg.scheduling_url,
        )


_SUBJECT = {
    "booked": "Interview booked",
    "rescheduled": "Interview moved",
    "cancelled": "Interview cancelled",
}


async def send_change(msg: InterviewMessage, change: Change) -> None:
    """Calendar invite (or cancellation) to both sides, SMS to the candidate."""
    method = "CANCEL" if change == "cancelled" else "REQUEST"
    ics = _ics(msg, method)
    subject = f"{_SUBJECT[change]}: {msg.job_title} at {msg.company_name}"
    when = _when(msg)
    if change == "cancelled":
        candidate_body = (
            _p(f"Your interview on {when} was cancelled.")
            + _p("You can pick another time here:")
            + _link(msg.scheduling_url, "Choose a new time")
        )
        recruiter_body = _p(
            f"The interview with {msg.candidate_name} on {when} was cancelled."
        )
    else:
        details = _p(when) + _link(msg.meeting_link, "Join the interview")
        candidate_body = (
            details
            + _p("Need another time?")
            + _link(msg.scheduling_url, "Reschedule or cancel")
        )
        recruiter_body = _p(f"{msg.candidate_name} for {msg.job_title}") + details

    if msg.candidate_email:
        await EmailService.send_calendar_email(
            msg.candidate_email, subject, candidate_body, ics, method
        )
    if msg.interviewer_email:
        await EmailService.send_calendar_email(
            msg.interviewer_email, subject, recruiter_body, ics, method
        )
    if msg.sms_enabled:
        await sms_candidate(
            msg.candidate_phone,
            f"interview_{change}",
            company=msg.company_name,
            job=msg.job_title,
            when=sms_when(msg.start, msg.timezone),
            link=msg.meeting_link or "",
            url=msg.scheduling_url,
        )


async def send_reminder(msg: InterviewMessage) -> None:
    subject = f"Reminder: interview for {msg.job_title}"
    body = _p(f"Your interview is on {_when(msg)}.") + _link(
        msg.meeting_link, "Join the interview"
    )
    for email in (msg.candidate_email, msg.interviewer_email):
        if email:
            await EmailService.send_generic_email(email, subject, body)
    if msg.sms_enabled:
        await sms_candidate(
            msg.candidate_phone,
            "interview_reminder",
            company=msg.company_name,
            when=sms_when(msg.start, msg.timezone),
            link=msg.meeting_link or "",
        )

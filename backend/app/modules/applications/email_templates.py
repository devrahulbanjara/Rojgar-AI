"""Fixed candidate emails sent as part of a recruiter decision.

Deterministic on purpose: AI review notes are recruiter-facing and never
reach a candidate, and every email is the same for everyone in that stage.
"""

from __future__ import annotations

from dataclasses import dataclass
from html import escape

from app.core.config import settings


@dataclass(frozen=True)
class EmailContent:
    template: str
    subject: str
    html: str


def _first_name(full_name: str | None) -> str:
    parts = (full_name or "").split()
    return parts[0] if parts else "there"


def _shell(body_html: str) -> str:
    return (
        '<div style="font-family: -apple-system, Segoe UI, sans-serif; '
        'max-width: 520px; margin: 0 auto; padding: 24px; color: #1c1917;">'
        f"{body_html}"
        f'<p style="font-size: 12px; color: #78716c; margin-top: 32px;">'
        f"{escape(settings.product_name)}</p></div>"
    )


def _link(href: str, label: str) -> str:
    return f'<p><a href="{escape(href, quote=True)}">{escape(label)}</a></p>'


def render(
    template: str,
    *,
    candidate_name: str | None,
    job_title: str,
    company_name: str,
    status_link: str | None = None,
    booking_url: str | None = None,
) -> EmailContent:
    """Return the email for one decision template.

    Templates: shortlist, interview_invite, offer, rejection.
    """
    name = escape(_first_name(candidate_name))
    job = escape(job_title)
    company = escape(company_name)
    status = _link(status_link, "See your application") if status_link else ""
    booking = (
        "<p>Please pick a time that suits you:</p>"
        + _link(booking_url, "Book your interview")
        if booking_url
        else ""
    )

    if template == "shortlist":
        subject = f"You're shortlisted for {job_title} at {company_name}"
        body = (
            f"<p>Hi {name},</p>"
            f"<p>Thanks for applying to <strong>{job}</strong> at {company}. "
            "We'd like to move forward with your application.</p>"
            f"{booking or '<p>We will contact you soon about the next step.</p>'}"
            f"{status}"
        )
    elif template == "interview_invite":
        subject = f"Interview for {job_title} at {company_name}"
        body = (
            f"<p>Hi {name},</p>"
            f"<p>{company} would like to interview you for <strong>{job}</strong>.</p>"
            f"{booking or '<p>The team will contact you with the time and place.</p>'}"
            f"{status}"
        )
    elif template == "offer":
        subject = f"An offer for {job_title} at {company_name}"
        body = (
            f"<p>Hi {name},</p>"
            f"<p>Good news: {company} would like to offer you the "
            f"<strong>{job}</strong> role. The team will contact you with the "
            "details.</p>"
            f"{status}"
        )
    elif template == "rejection":
        subject = f"Your application for {job_title} at {company_name}"
        body = (
            f"<p>Hi {name},</p>"
            f"<p>Thank you for applying to <strong>{job}</strong> at {company} "
            "and for the time you put into it. We won't be moving forward with "
            "your application this time.</p>"
            "<p>We wish you all the best in your search.</p>"
            f"{status}"
        )
    else:
        raise ValueError(f"Unknown email template: {template}")
    return EmailContent(template=template, subject=subject, html=_shell(body))

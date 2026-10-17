from __future__ import annotations

import html
from html.parser import HTMLParser

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from pydantic import SecretStr

from app.core.config import settings
from app.shared.enums import ApplicationStatus

_SHORTLIST_SYSTEM = """
You are a professional hiring coordinator writing on behalf of {company_name}.
Write a warm, concise shortlist email to a candidate who has been selected to move
forward in the hiring process.

Rules:
- Address them by first name only
- Mention the job title and company name
- Include the interview scheduling link naturally; it lets them pick, move or cancel a time
- Keep it under 180 words
- Sound human, not corporate
- Do NOT include any closing, sign-off, signature, or footer (e.g. no "Warm regards", "Best", "[Your Name]", etc.)
- Output only the HTML email body, no subject line, no ```html, direct html content
""".strip()

_llm = ChatGroq(
    model=settings.groq_model_recruiter_chat,
    # Low temperature keeps the shortlist note grounded in the provided strengths.
    temperature=0.2,
    timeout=30,
    max_retries=2,
    api_key=SecretStr(settings.groq_api_key),
)

_shortlist_chain = (
    ChatPromptTemplate.from_messages(
        [
            ("system", _SHORTLIST_SYSTEM),
            (
                "human",
                (
                    "Candidate name: {candidate_name}\n"
                    "Job title: {job_title}\n"
                    "Interview scheduling link: {booking_url}\n"
                    "What stood out in their application: {feedback}"
                ),
            ),
        ]
    )
    | _llm
    | StrOutputParser()
)


def _first_name(candidate_name: str) -> str:
    """Return the first token from a candidate's display name."""
    parts = candidate_name.split()
    return parts[0] if parts else "there"


def _static_template(
    application_status: ApplicationStatus,
    first_name: str,
    job_title: str,
    company_name: str,
    booking_url: str | None,
) -> tuple[str, str]:
    """Deterministic email body for cohorts without AI feedback.

    Used when ``Application.feedback`` is null/empty so the LLM cannot
    invent reasons. Mirrors a minimal, human-sounding template.
    """
    safe_name = html.escape(first_name)
    safe_company = html.escape(company_name)
    safe_job = html.escape(job_title)

    if application_status == ApplicationStatus.shortlisted:
        subject = f"You've been shortlisted for {job_title} at {company_name}"
        body = (
            f"<p>Hi {safe_name},</p>"
            f"<p>Thanks for applying to <strong>{safe_job}</strong> at "
            f"{safe_company}. We'd like to move forward with your application.</p>"
        )
        if booking_url:
            safe_link = html.escape(booking_url, quote=True)
            body += (
                "<p>Pick an interview time that suits you:</p>"
                f'<p><a href="{safe_link}">Choose an interview time</a></p>'
            )
        body += "<p>Looking forward to speaking soon.</p>"
        return subject, body

    subject = f"Update on your {job_title} application"
    body = (
        f"<p>Hi {safe_name},</p>"
        f"<p>Thank you for your interest in <strong>{safe_job}</strong> at "
        f"{safe_company}. After reviewing your application, we won't be moving "
        "forward at this time.</p>"
        "<p>We appreciate the time you took to apply and wish you the best.</p>"
    )
    return subject, body


_ALLOWED_TAGS = {"p", "br", "strong", "b", "em", "i", "ul", "ol", "li", "a"}


class _EmailSanitizer(HTMLParser):
    """Allow-list sanitizer for LLM-written email HTML.

    Keeps simple formatting tags and http(s)/mailto links; everything else is
    reduced to escaped text, so model output cannot inject scripts, tracking
    pixels, forms, or arbitrary attributes into mail sent from our domain.
    """

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.out: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag not in _ALLOWED_TAGS:
            return
        if tag == "a":
            href = next((v for k, v in attrs if k == "href" and v), "")
            if not href.lower().startswith(("https://", "http://", "mailto:")):
                return
            self.out.append(f'<a href="{html.escape(href, quote=True)}">')
            return
        self.out.append("<br />" if tag == "br" else f"<{tag}>")

    def handle_endtag(self, tag):
        if tag in _ALLOWED_TAGS and tag != "br":
            self.out.append(f"</{tag}>")

    def handle_data(self, data):
        self.out.append(html.escape(data))


def sanitize_email_html(raw: str) -> str:
    """Return email HTML restricted to a small allow-list of tags."""
    parser = _EmailSanitizer()
    parser.feed(raw.replace("```html", "").replace("```", ""))
    parser.close()
    return "".join(parser.out).strip()


async def compose_email(
    candidate_name: str,
    company_name: str,
    job_title: str,
    application_status: ApplicationStatus,
    strengths: list[str] | None,
    weaknesses: list[str] | None = None,
    booking_url: str | None = None,
) -> tuple[str, str]:
    """Compose an outreach email tailored to the candidate and job context.

    Rejections always use the static template: internal AI review notes
    (weaknesses) are recruiter-facing judgments and must never be paraphrased
    into candidate mail. Shortlist notes may mention strengths only.
    """
    del weaknesses  # deliberately never used in candidate-facing mail
    first_name = _first_name(candidate_name)

    if application_status != ApplicationStatus.shortlisted or not strengths:
        return _static_template(
            application_status,
            first_name,
            job_title,
            company_name,
            booking_url,
        )

    subject = f"You've been shortlisted for {job_title} at {company_name}"
    body = await _shortlist_chain.ainvoke(
        {
            "company_name": company_name,
            "candidate_name": first_name,
            "job_title": job_title,
            "booking_url": booking_url or "",
            "feedback": "; ".join(strengths),
        }
    )
    return subject, sanitize_email_html(body)

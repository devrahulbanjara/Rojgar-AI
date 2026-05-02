from __future__ import annotations

import html

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from loguru import logger
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
- Include the interview booking link naturally
- Explicitly tell them to book using the exact name and email address they used to sign up to ConvexHire, so we can match their booking automatically
- Keep it under 180 words
- Sound human, not corporate
- Do NOT include any closing, sign-off, signature, or footer (e.g. no "Warm regards", "Best", "[Your Name]", etc.)
- Output only the HTML email body, no subject line, no ```html, direct html content
""".strip()

_REJECTION_SYSTEM = """
You are a professional hiring coordinator writing on behalf of {company_name}.
Write a kind, motivating rejection email to a candidate who was not selected.

Rules:
- Address them by first name only
- Mention the job title
- Include the specific feedback provided by paraphrasing it naturally
- Be encouraging and wish them well
- Keep it under 150 words
- Sound human, not robotic
- Do NOT include any closing, sign-off, signature, or footer (e.g. no "Warm regards", "Best", "[Your Name]", etc.)
- Output only the HTML email body, no subject line, , no ```html, direct html content
""".strip()

_llm = ChatGroq(
    model=settings.groq_model_recruiter_chat,
    # Lower temperature reduces hallucinated feedback in rejection/shortlist emails.
    # 0.2 keeps tone natural while staying grounded in the provided strengths/weaknesses.
    temperature=0.2,
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
                    "Interview booking link: {booking_url}\n"
                    "Feedback from review: {feedback}"
                ),
            ),
        ]
    )
    | _llm
    | StrOutputParser()
)

_rejection_chain = (
    ChatPromptTemplate.from_messages(
        [
            ("system", _REJECTION_SYSTEM),
            (
                "human",
                (
                    "Candidate name: {candidate_name}\n"
                    "Job title: {job_title}\n"
                    "Feedback from review: {feedback}"
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
                "<p>Please book a time using the same name and email you used "
                "to sign up to ConvexHire so we can match your booking automatically:</p>"
                f'<p><a href="{safe_link}">Book your interview</a></p>'
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


def _format_review_text(
    strengths: list[str] | None, weaknesses: list[str] | None
) -> str:
    """Join strengths/weaknesses into a compact text for the LLM chain."""
    parts: list[str] = []
    if strengths:
        parts.append("Strengths: " + "; ".join(strengths))
    if weaknesses:
        parts.append("Weaknesses: " + "; ".join(weaknesses))
    return " | ".join(parts)


async def compose_email(
    candidate_name: str,
    company_name: str,
    job_title: str,
    application_status: ApplicationStatus,
    strengths: list[str] | None,
    weaknesses: list[str] | None,
    booking_url: str | None = None,
) -> tuple[str, str]:
    """Compose an outreach email tailored to the candidate and job context."""
    first_name = _first_name(candidate_name)

    feedback_text = _format_review_text(strengths, weaknesses)
    if not feedback_text:
        logger.info(
            "outreach.compose.no_feedback_static candidate='{}' job='{}' status='{}'",
            candidate_name,
            job_title,
            application_status.value,
        )
        return _static_template(
            application_status,
            first_name,
            job_title,
            company_name,
            booking_url,
        )

    if application_status == ApplicationStatus.shortlisted:
        subject = f"You've been shortlisted for {job_title} at {company_name}"
        body = await _shortlist_chain.ainvoke(
            {
                "company_name": company_name,
                "candidate_name": first_name,
                "job_title": job_title,
                "booking_url": booking_url or "",
                "feedback": feedback_text,
            }
        )
    else:
        subject = f"Your application for {job_title} at {company_name}"
        body = await _rejection_chain.ainvoke(
            {
                "company_name": company_name,
                "candidate_name": first_name,
                "job_title": job_title,
                "feedback": feedback_text,
            }
        )

    return subject, body.strip()

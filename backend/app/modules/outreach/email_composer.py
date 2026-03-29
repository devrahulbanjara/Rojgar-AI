from __future__ import annotations

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
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
- Output only the HTML email body, no subject line, , no ```html, direct html content
""".strip()

_llm = ChatGroq(
    model=settings.groq_model_recruiter_chat,
    temperature=0.7,
    api_key=settings.groq_api_key,
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
    parts = candidate_name.split()
    return parts[0] if parts else "there"


async def compose_email(
    candidate_name: str,
    company_name: str,
    job_title: str,
    application_status: ApplicationStatus,
    feedback: str | None,
    booking_url: str | None = None,
) -> tuple[str, str]:
    first_name = _first_name(candidate_name)
    feedback_text = (feedback or "No specific feedback available.").strip()

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

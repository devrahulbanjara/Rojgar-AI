from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date
from functools import lru_cache
from typing import Any, cast

from loguru import logger

from app.agents.shortlisting.graph import create_workflow
from app.core.config import settings
from app.infrastructures.guardrails import guardrails_service
from app.modules.applications.models import Application
from app.modules.jobs.models import Job


@dataclass
class ShortlistingAgentResult:
    """Plain result container returned after the workflow completes.

    The LLM agent is responsible for qualitative review only; numeric scoring
    is owned by the ML bouncer upstream.
    """

    strengths: list[str] | None
    weaknesses: list[str] | None
    # True when the resume could not be reviewed automatically (guardrail flag
    # or classifier outage); the recruiter must review it by hand.
    needs_human_review: bool = False
    review_note: str | None = None


def stringify_job(job: Job) -> str:
    """Serialise a job into structured plain text for the shortlisting prompt."""
    sections: list[str] = [
        f"Title: {job.title}",
        f"Location: {job.location or 'Not specified'}",
        f"Location type: {job.location_type.value}",
        f"Overview: {job.overview or 'Not provided'}",
        "Responsibilities:",
    ]
    responsibilities = job.responsibilities or []
    if responsibilities:
        sections.extend(f"- {item}" for item in responsibilities)
    else:
        sections.append("- Not provided")

    sections.append("Requirements:")
    requirements = job.requirements or []
    if requirements:
        sections.extend(f"- {item}" for item in requirements)
    else:
        sections.append("- Not provided")

    sections.append("Preferred qualifications:")
    preferred = job.preferred_qualifications or []
    if preferred:
        sections.extend(f"- {item}" for item in preferred)
    else:
        sections.append("- Not provided")

    sections.append("Benefits:")
    benefits = job.benefits or []
    if benefits:
        sections.extend(f"- {item}" for item in benefits)
    else:
        sections.append("- Not provided")

    return "\n".join(sections)


_EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
_URL_RE = re.compile(r"(https?://\S+|www\.\S+)", re.IGNORECASE)
_PHONE_RE = re.compile(r"\+?\d[\d\s().-]{7,}\d")


def _redact_identity(text: str, name_tokens: list[str]) -> str:
    """Strip contact details and the candidate's own name from free text."""
    text = _EMAIL_RE.sub("[email]", text)
    text = _URL_RE.sub("[link]", text)
    text = _PHONE_RE.sub("[phone]", text)
    for token in name_tokens:
        text = re.sub(rf"\b{re.escape(token)}\b", "[candidate]", text, flags=re.I)
    return text


def _name_tokens(full_name: str | None) -> list[str]:
    """Return name parts long enough to redact without mangling ordinary words."""
    if not full_name:
        return []
    parts = [p for p in re.split(r"\s+", full_name.strip()) if len(p) >= 3]
    return sorted({full_name.strip(), *parts}, key=len, reverse=True)


def _role_duration(start: date | None, end: date | None) -> str:
    """Express a role as a duration instead of calendar dates (dates leak age)."""
    if start is None:
        return "duration not provided"
    end_date = end or date.today()
    months = max(0, (end_date.year - start.year) * 12 + end_date.month - start.month)
    if months < 12:
        label = f"{months} mo"
    else:
        label = f"{months / 12:.1f} yrs"
    return f"{label}{', current' if end is None else ''}"


def stringify_resume(
    application: Application, candidate_name: str | None = None
) -> str:
    """Serialise the application's attached resume into prompt-ready plain text.

    Blind-review rules: the candidate's name, email, phone, and links are
    removed (including from the free-text headline and summary); roles are given
    as durations rather than calendar dates, which reveal age; institution names
    are omitted so university prestige cannot influence the review — the degree
    and field are what a JD can legitimately require.
    """
    resume = application.resume
    if resume is None:
        return "Resume: Not attached."

    tokens = _name_tokens(candidate_name)

    def clean(value: str | None) -> str:
        return _redact_identity(value, tokens) if value else "Not provided"

    sections: list[str] = [
        f"Headline: {clean(resume.headline)}",
        f"Summary: {clean(resume.summary)}",
        f"Years of experience: {resume.years_of_experience if resume.years_of_experience is not None else 'Not provided'}",
        "Experience:",
    ]

    if resume.experiences:
        for experience in resume.experiences:
            sections.append(
                f"- {experience.title} at {experience.company_name} "
                f"({_role_duration(experience.start_date, experience.end_date)})"
            )
            if experience.description:
                sections.extend(
                    f"  * {_redact_identity(line, tokens)}"
                    for line in experience.description
                )
    else:
        sections.append("- Not provided")

    sections.append("Education:")
    if resume.educations:
        for education in resume.educations:
            sections.append(
                f"- {education.degree or 'Degree not provided'} in "
                f"{education.field_of_study or 'Field not provided'}"
            )
    else:
        sections.append("- Not provided")

    sections.append("Skills:")
    if resume.skills:
        sections.append("- " + ", ".join(skill.skill_name for skill in resume.skills))
    else:
        sections.append("- Not provided")

    return "\n".join(sections)


def build_shortlisting_inputs_from_text(
    *, application_ref: str, job_title: str, jd_text: str, resume_text: str
) -> dict:
    """Construct the initial workflow state from pre-rendered text."""
    return {
        "application_ref": application_ref,
        "job_title": job_title,
        "jd": jd_text,
        "resume": resume_text,
        "max_iterations": settings.shortlisting_reflection_max_iterations,
        "iteration": 0,
        "cto_evals": [],
        "hr_evals": [],
        "critiques": [],
        "is_satisfied": False,
        "confidence": 0.0,
        "final_strengths": None,
        "final_weaknesses": None,
    }


def build_shortlisting_inputs(
    job: Job, application: Application, candidate_name: str | None = None
) -> dict:
    """Construct the initial workflow state for one job/application pair."""
    return build_shortlisting_inputs_from_text(
        application_ref=str(application.id),
        job_title=job.title,
        jd_text=stringify_job(job),
        resume_text=stringify_resume(application, candidate_name),
    )


@lru_cache(maxsize=1)
def get_compiled_shortlisting_workflow():
    """Return the compiled shortlisting workflow, cached per process."""
    return create_workflow().compile()


def build_shortlisting_result(result: dict) -> ShortlistingAgentResult:
    """Extract the final workflow fields into a stable return type."""
    return ShortlistingAgentResult(
        strengths=result.get("final_strengths"),
        weaknesses=result.get("final_weaknesses"),
    )


async def evaluate_resume_text(
    *, application_ref: str, job_title: str, jd_text: str, resume_text: str
) -> ShortlistingAgentResult:
    """Run the shortlisting workflow on pre-rendered job and resume text.

    Works only on plain strings, so batch callers can release their database
    transaction before the (slow) LLM calls and never touch ORM state here.

    The resume is screened once by the prompt-injection rail before any model
    sees it. A flagged resume (or a classifier outage) is not reviewed by the
    LLM and is routed to the recruiter instead; the guardrail's reason is never
    written into candidate-facing strengths or weaknesses.
    """
    verdict = await guardrails_service.check_input(
        resume_text, source="shortlisting", fail_closed=True
    )
    if not verdict.safe:
        logger.warning(
            "[app={}] Shortlisting skipped: resume flagged for human review.",
            application_ref,
        )
        return ShortlistingAgentResult(
            strengths=None,
            weaknesses=None,
            needs_human_review=True,
            review_note=(
                "Flagged for manual review by the prompt-injection rail: "
                f"{verdict.reason or 'suspicious content'}"
            ),
        )
    if verdict.error:
        logger.warning(
            "[app={}] Guardrail classifier unavailable; no injection markers found, "
            "continuing review.",
            application_ref,
        )

    inputs = build_shortlisting_inputs_from_text(
        application_ref=application_ref,
        job_title=job_title,
        jd_text=jd_text,
        resume_text=resume_text,
    )
    workflow = get_compiled_shortlisting_workflow()
    logger.info("[app={}] Shortlisting workflow START", application_ref)
    result = await workflow.ainvoke(cast(Any, inputs))
    return build_shortlisting_result(result)


async def evaluate_application_with_shortlisting_agent(
    *, job: Job, application: Application, candidate_name: str | None = None
) -> ShortlistingAgentResult:
    """Run the full shortlisting workflow for a single loaded application."""
    if candidate_name is None:
        # Read only already-loaded state; never trigger a lazy load here.
        loaded_user = application.__dict__.get("user")
        candidate_name = getattr(loaded_user, "full_name", None)
    return await evaluate_resume_text(
        application_ref=str(application.id),
        job_title=job.title,
        jd_text=stringify_job(job),
        resume_text=stringify_resume(application, candidate_name),
    )

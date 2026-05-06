from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any, cast

from loguru import logger

from app.agents.shortlisting.graph import create_workflow
from app.core.config import settings
from app.modules.applications.models import Application
from app.modules.jobs.models import Job


@dataclass
class ShortlistingAgentResult:
    """Plain result container returned after the workflow completes."""

    score: int
    reason: str
    strengths: list[str] | None
    weaknesses: list[str] | None


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


def stringify_resume(application: Application) -> str:
    """Serialise the application's attached resume into prompt-ready plain text.

    PII anonymisation: candidate name, email, phone, and personal URLs are
    intentionally excluded so the shortlisting LLM cannot be influenced by
    demographic signals embedded in those fields (gender-coded names, nationality
    inferred from phone prefix, etc.).  Institution names are preserved because
    they carry relevant academic context, but evaluators are instructed in the
    system prompt not to weight prestige.
    """
    resume = application.resume
    if resume is None:
        return "Resume: Not attached."

    sections: list[str] = [
        # Name, email, phone, and URLs are deliberately omitted (PII / bias risk).
        f"Headline: {resume.headline or 'Not provided'}",
        f"Summary: {resume.summary or 'Not provided'}",
        f"Years of experience: {resume.years_of_experience if resume.years_of_experience is not None else 'Not provided'}",
        "Experience:",
    ]

    if resume.experiences:
        for experience in resume.experiences:
            sections.append(
                f"- {experience.title} at {experience.company_name} "
                f"({experience.start_date or 'Unknown start'} to {experience.end_date or 'Present'})"
            )
            if experience.description:
                sections.extend(f"  * {line}" for line in experience.description)
    else:
        sections.append("- Not provided")

    sections.append("Education:")
    if resume.educations:
        for education in resume.educations:
            sections.append(
                f"- {education.degree or 'Degree not provided'} in "
                f"{education.field_of_study or 'Field not provided'} at {education.institution}"
            )
    else:
        sections.append("- Not provided")

    sections.append("Skills:")
    if resume.skills:
        sections.append("- " + ", ".join(skill.skill_name for skill in resume.skills))
    else:
        sections.append("- Not provided")

    return "\n".join(sections)


def build_shortlisting_inputs(job: Job, application: Application) -> dict:
    """Construct the initial workflow state for one job/application pair."""
    return {
        "job_title": job.title,
        "jd": stringify_job(job),
        "resume": stringify_resume(application),
        "max_iterations": settings.shortlisting_reflection_max_iterations,
        "iteration": 0,
        "cto_evals": [],
        "hr_evals": [],
        "critiques": [],
        "is_satisfied": False,
        "final_strengths": None,
        "final_weaknesses": None,
    }


@lru_cache(maxsize=1)
def get_compiled_shortlisting_workflow():
    """Return the compiled shortlisting workflow, cached per process."""
    return create_workflow().compile()


def build_shortlisting_result(result: dict) -> ShortlistingAgentResult:
    """Extract the final workflow fields into a stable return type."""
    return ShortlistingAgentResult(
        score=result["final_score"],
        reason=result["final_reason"],
        strengths=result.get("final_strengths"),
        weaknesses=result.get("final_weaknesses"),
    )


async def evaluate_application_with_shortlisting_agent(
    *, job: Job, application: Application
) -> ShortlistingAgentResult:
    """Run the full shortlisting workflow for a single application."""
    workflow = get_compiled_shortlisting_workflow()
    inputs = build_shortlisting_inputs(job, application)
    applicant_name = getattr(
        getattr(application, "user", None), "full_name", None
    ) or str(application.id)
    logger.info(
        "Running shortlisting agent workflow for '{}' on '{}' ({})",
        applicant_name,
        job.title,
        job.id,
    )
    result = await workflow.ainvoke(cast(Any, inputs))
    return build_shortlisting_result(result)

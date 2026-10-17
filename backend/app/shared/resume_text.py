"""Plain-text views of a resume used by safety rails."""

from app.modules.resumes.models import Resume


def resume_text_for_guardrails(resume: Resume) -> str:
    """Flatten every candidate-controlled free-text field into one string for the input rail."""
    parts: list[str] = []
    for attr in (
        "resume_name",
        "headline",
        "summary",
        "location",
        "linkedin_url",
        "github_url",
        "portfolio_url",
    ):
        value = getattr(resume, attr, None)
        if value:
            parts.append(str(value))
    for experience in resume.experiences:
        if experience.title:
            parts.append(str(experience.title))
        if experience.company_name:
            parts.append(str(experience.company_name))
        for bullet in experience.description or []:
            parts.append(str(bullet))
    for education in resume.educations:
        if education.institution:
            parts.append(str(education.institution))
        if education.degree:
            parts.append(str(education.degree))
        if education.field_of_study:
            parts.append(str(education.field_of_study))
    for skill in resume.skills:
        if skill.skill_name:
            parts.append(str(skill.skill_name))
    return "\n".join(parts)

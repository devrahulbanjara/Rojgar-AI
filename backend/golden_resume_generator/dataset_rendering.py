from __future__ import annotations

from datetime import date
from functools import lru_cache
from pathlib import Path
from typing import Any

from jinja2 import Template

from app.modules.profiles.ai_import_schemas import ImportedCandidateDocument

from dataset_models import ResumeRenderPlan, ResumeSpec
from dataset_settings import TEMPLATES_DIR


TEMPLATE_FILES_BY_STYLE = {
    "simple_single_column": "simple_single_column.html",
    "double_column_canva": "double_column_canva.html",
    "professional_standard": "professional_standard.html",
}


@lru_cache(maxsize=None)
def load_template_source(style_key: str) -> str:
    template_name = TEMPLATE_FILES_BY_STYLE.get(style_key)
    if template_name is None:
        raise ValueError(f"Unknown resume style '{style_key}'.")

    template_path = TEMPLATES_DIR / template_name
    return template_path.read_text(encoding="utf-8")


def format_resume_date(value: date | None, date_style: str) -> str:
    if value is None:
        return ""
    if date_style == "year_only":
        return value.strftime("%Y")
    if date_style == "month_year_full":
        return value.strftime("%B %Y")
    return value.strftime("%b %Y")


def format_date_range(
    start_date: date | None,
    end_date: date | None,
    date_style: str,
    *,
    end_label: str = "Present",
) -> str:
    start_text = format_resume_date(start_date, date_style)
    end_text = (
        end_label if end_date is None else format_resume_date(end_date, date_style)
    )

    if start_text and end_text:
        return f"{start_text} - {end_text}"
    return start_text or end_text


def build_render_sections(
    document: ImportedCandidateDocument,
    spec: ResumeSpec,
) -> dict[str, Any]:
    experiences = list(document.experiences)
    summary_title = "Summary"
    education_title = "Education"
    if spec.render_variant == 2:
        summary_title = "Profile"
        education_title = "Academic Background"
    elif spec.render_variant == 3:
        summary_title = "Career Snapshot"
    elif spec.render_variant == 4:
        summary_title = "About"
    elif spec.render_variant == 5:
        summary_title = "Professional Summary"

    experience_sections = []
    if experiences:
        experience_sections.append({"title": "Experience", "entries": experiences})

    return {
        "summary_title": summary_title,
        "education_title": education_title,
        "experience_sections": experience_sections,
        "skills_section_title": "Technical Skills",
        "skills_lines": [],
        "show_skills_section": False,
    }


def sanitize_render_plan(
    document: ImportedCandidateDocument,
    spec: ResumeSpec,
    plan: ResumeRenderPlan,
) -> dict[str, Any]:
    fallback = build_render_sections(document, spec)
    experiences = list(document.experiences)
    used_indices: set[int] = set()
    experience_sections: list[dict[str, Any]] = []

    for section in plan.experience_sections:
        entries: list[Any] = []
        for entry_index in section.entry_indices:
            if not 0 <= entry_index < len(experiences):
                continue
            if entry_index in used_indices:
                continue
            used_indices.add(entry_index)
            entries.append(experiences[entry_index])
        if entries:
            experience_sections.append(
                {
                    "title": section.title.strip() or "Experience",
                    "entries": entries,
                }
            )

    if not experience_sections:
        experience_sections = fallback["experience_sections"]

    skills_lines = [line.strip() for line in plan.skills_lines if line.strip()]

    return {
        "summary_title": plan.summary_title.strip() or fallback["summary_title"],
        "education_title": plan.education_title.strip() or fallback["education_title"],
        "experience_sections": experience_sections,
        "skills_section_title": (
            plan.skills_section_title.strip()
            if plan.skills_section_title and plan.skills_section_title.strip()
            else fallback["skills_section_title"]
        ),
        "skills_lines": skills_lines,
        "show_skills_section": bool(skills_lines),
    }


def render_pdf(
    document: ImportedCandidateDocument,
    spec: ResumeSpec,
    render_context: dict[str, Any],
    output_path: Path,
) -> None:
    from weasyprint import HTML

    template = Template(load_template_source(spec.style_key))
    context = document.model_dump(mode="python")
    context.update(render_context)
    context["format_date_range"] = lambda start, end, end_label="Present": (
        format_date_range(start, end, spec.date_style, end_label=end_label)
    )
    html_content = template.render(**context)
    HTML(string=html_content).write_pdf(str(output_path))

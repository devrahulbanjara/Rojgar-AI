from __future__ import annotations

from dataset_models import ResumeSpec
from dataset_personas import (
    NEPAL_COLLEGE_REFERENCE_POOL,
    NEPAL_COMPANY_REFERENCE_POOL,
    NEPAL_ROLE_REFERENCE_POOL,
    NEPAL_UNIVERSITY_CONTEXT,
)
from dataset_settings import STYLE_TARGET_COUNT, TOTAL_RESUMES


SYSTEM_PROMPT = """
You generate realistic structured resume data plus a realistic PDF render plan for evaluation datasets.

Return a response that matches the provided Pydantic schema exactly.

Requirements for `document`:
- Produce a realistic candidate profile that is internally consistent.
- The candidate must be fictional but clearly Nepali or Nepalese.
- Every employer, university, college, city, and contextual detail must be Nepal-specific.
- Use real Nepal organizations and institutions when selecting companies and schools.
- Do not use placeholder text.
- Do not use famous public figures or copy real biographies.
- Keep chronology sensible.
- Keep years_of_experience aligned with the experience timeline.
- Use 2 to 5 experience entries unless the edge case strongly implies otherwise.
- Use 1 to 3 education entries depending on the persona.
- Use 6 to 20 skills for most resumes. For an explicitly skill-dense persona, you may exceed 20.
- Keep warnings as an empty list because this is source-of-truth authoring, not extraction.
- Do not invent fields outside the schema.

Requirements for `render_plan`:
- You are only deciding how the same resume should be visibly organized in the PDF.
- Do not invent any new facts, employers, schools, projects, or skills.
- Never create a target roles section.
- Some resumes may omit a visible skills section entirely.
- Some resumes may show skills as categorized lines, others as plain lines, and some may have no skills section.
- Some resumes may split experience into two sections such as Internships and Experience or Projects and Experience.
- Use only valid experience entry indices from the `document.experiences` list.
- Keep the output realistic for real resumes, not product-specific.
"""


def build_user_prompt(spec: ResumeSpec) -> str:
    return (
        "Generate one realistic resume document for a golden dataset used to evaluate "
        "resume import accuracy.\n"
        f"Dataset slot: {spec.index} of {TOTAL_RESUMES}\n"
        f"Style bucket: {spec.style_label}\n"
        f"Style bucket position: {spec.style_bucket_index} of {STYLE_TARGET_COUNT}\n"
        f"Career level: {spec.career_level}\n"
        f"Primary domain: {spec.domain}\n"
        f"Edge case to include naturally: {spec.edge_case}\n"
        f"Layout/content guidance: {spec.style_prompt}\n"
        f"Use Nepal locations only: {spec.location_hint}\n"
        f"Prefer real Nepal employers or organizations such as: {spec.company_hint}\n"
        f"Prefer real Nepal universities or colleges such as: {spec.education_hint}\n"
        f"Additional Nepal college variety pool: {', '.join(NEPAL_COLLEGE_REFERENCE_POOL)}\n"
        f"Additional Nepal university context: {', '.join(NEPAL_UNIVERSITY_CONTEXT)}\n"
        f"Additional Nepal company variety pool: {', '.join(NEPAL_COMPANY_REFERENCE_POOL)}\n"
        f"Additional Nepal role variety pool: {', '.join(NEPAL_ROLE_REFERENCE_POOL)}\n"
        f"Resume date display feel: {spec.date_style.replace('_', ' ')}\n"
        f"Render inconsistency variant for this slot: {spec.render_variant}\n"
        "Real-world resume guidance:\n"
        "- Write this as if a real person is preparing a resume, not as if they know anything about ConvexHire.\n"
        "- Do not create a dedicated Target Roles or Preferred Roles section.\n"
        "- Keep target_roles as an empty list unless a role preference is explicitly embedded in the resume text, which should be rare.\n"
        "- Use a concise, realistic resume structure focused on header, technical skills, experience or projects, and education.\n"
        "- Because the schema has no separate projects field, represent major academic, freelance, or personal projects through realistic experience-like entries when needed.\n"
        "- Decide the visible PDF organization too: section titles, whether skills appear at all, whether skills are shown as plain lines or categorized lines, and whether experience is split into one or two sections.\n"
        "- If you categorize skills for the visible PDF, do it in render_plan.skills_lines only. The document.skills list must stay flat.\n"
        "- Do not use self-ratings, percentage bars, or gimmicky proficiency scores.\n"
        "- Use measurable, action-oriented bullets where possible.\n"
        "- Prefer city and country context rather than a full street address.\n"
        "- For freshers or interns, it is realistic to emphasize projects, coursework, internships, clubs, or training over formal work experience.\n"
        "Hard constraints:\n"
        "- Every company, institution, city, and contextual detail must be related to Nepal.\n"
        "- The candidate must be fictional, but the name should sound naturally Nepali.\n"
        "- Use realistic Nepali phone numbers and Nepal addresses or city labels.\n"
        "- Keep the resume content plausible for the domain and experience level.\n"
        "- Keep the generated schema internally consistent and production-quality.\n"
        "- Diversify institutions, companies, and role histories across the dataset slot instead of repeating the same few examples.\n"
        "- Do not force every candidate to have every field. Freshers may have no work experience. Some resumes may be education-heavy, internship-heavy, or project-heavy.\n"
        "- If the persona is a fresher or intern, it is acceptable to leave the experience list empty and rely on education, projects, achievements, or skills.\n"
        "- Keep content suitable for real-world resume inconsistencies: uneven section density, missing links, or stronger education than experience.\n"
        "- Use realistic resume content rather than placeholders."
    )

from app.modules.resume_gap.schemas import GapItem


def _norm(text: str) -> str:
    """Lowercase + collapse whitespace for tolerant substring grounding."""
    return " ".join(text.lower().split())


def _resume_grounding_text(resume_data: dict) -> str:
    parts: list[str] = []
    if headline := resume_data.get("headline"):
        parts.append(str(headline))
    if summary := resume_data.get("summary"):
        parts.append(str(summary))
    for skill in resume_data.get("skills", []) or []:
        parts.append(str(skill))
    for experience in resume_data.get("experiences", []) or []:
        for field in ("title", "company"):
            if value := experience.get(field):
                parts.append(str(value))
        for bullet in experience.get("description", []) or []:
            parts.append(str(bullet))
    for education in resume_data.get("educations", []) or []:
        for field in ("institution", "degree", "field"):
            if value := education.get(field):
                parts.append(str(value))
    return "\n".join(parts)


def _job_grounding_text(job_data: dict) -> str:
    parts: list[str] = []
    if title := job_data.get("title"):
        parts.append(str(title))
    if overview := job_data.get("overview"):
        parts.append(str(overview))
    for bucket in ("requirements", "preferred_qualifications", "responsibilities"):
        for value in job_data.get(bucket, []) or []:
            parts.append(str(value))
    return "\n".join(parts)


def filter_grounded(
    items: list[GapItem],
    resume_data: dict,
    job_data: dict,
) -> tuple[list[GapItem], list[GapItem]]:
    """Drop GapItem entries whose evidence_span does not substring-match the
    declared source. Items without an evidence_source pass through (e.g.,
    older cached results that pre-date the grounding contract)."""
    sources = {
        "resume": _norm(_resume_grounding_text(resume_data)),
        "jd": _norm(_job_grounding_text(job_data)),
    }
    kept: list[GapItem] = []
    dropped: list[GapItem] = []
    for item in items:
        if item.evidence_source in ("resume", "jd"):
            if (
                _norm(item.evidence_span)
                and _norm(item.evidence_span) in sources[item.evidence_source]
            ):
                kept.append(item)
            else:
                dropped.append(item)
        else:
            kept.append(item)
    return kept, dropped

import re

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
    declared source. Items without an evidence source are dropped too:
    otherwise the model could skip grounding simply by leaving it blank."""
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
            dropped.append(item)
    return kept, dropped


_NUMBER_RE = re.compile(r"\d+(?:[.,]\d+)*")
_TOKEN_RE = re.compile(r"[A-Za-z][A-Za-z0-9+#./-]*")
_SENTENCE_START_RE = re.compile(r"(?:^|[.!?;:]\s+)([A-Za-z][\w+#./-]*)")


def resume_support_text(resume_data: dict) -> str:
    """All candidate-authored resume text, normalized, for evidence checks."""
    return _norm(_resume_grounding_text(resume_data))


def _proper_tokens(text: str) -> set[str]:
    """Capitalized / technical tokens that are not just sentence-initial words."""
    sentence_starts = {m.group(1) for m in _SENTENCE_START_RE.finditer(text)}
    tokens: set[str] = set()
    for token in _TOKEN_RE.findall(text):
        token = token.rstrip("./-")
        if not token or token in sentence_starts:
            continue
        technical = any(c.isdigit() or c in "+#." for c in token[1:])
        if token[0].isupper() or technical or token.isupper():
            tokens.add(token.lower())
    return tokens


def unsupported_claims(new_text: str, support_text: str) -> list[str]:
    """Return numbers / technical or proper-noun tokens in `new_text` that the
    support text never mentions.

    Used to reject AI rewrites that invent metrics or technologies. `support_text`
    must already be normalized with `_norm`.
    """
    support_numbers = set(_NUMBER_RE.findall(support_text))
    problems = [n for n in _NUMBER_RE.findall(new_text) if n not in support_numbers]
    for token in _proper_tokens(new_text):
        if not re.search(rf"(?<![\w]){re.escape(token)}(?![\w])", support_text):
            problems.append(token)
    return problems


def skill_is_evidenced(skill: str, support_text: str) -> bool:
    """True when a proposed new skill already appears in the resume text."""
    needle = _norm(skill)
    if not needle:
        return False
    return re.search(rf"(?<![\w]){re.escape(needle)}(?![\w])", support_text) is not None

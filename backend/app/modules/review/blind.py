"""Blind text for the review: what the candidate offers, without who they are.

Removed: name, contact details, gender cues (pronouns, honorifics, gender
lines), calendar dates and ages, address/hometown lines, photos (never sent),
and institution names unless a must-have names a credential. Roles keep their
duration ("2.5 yrs"), which is evidence, not identity.

Works on English, Nepali (Devanagari) and mixed text.
"""

from __future__ import annotations

import re
from datetime import date
from typing import Any

from app.shared.unicode_text import strip_invisible

_EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
_URL_RE = re.compile(
    r"(https?://\S+|www\.\S+|\b[\w-]+\.(?:com|np|org|net|io)/\S*)", re.IGNORECASE
)
_PHONE_RE = re.compile(r"(?<!\w)\+?[\d०-९][\d०-९\s().-]{6,}[\d०-९](?!\w)")

# Whole lines that only describe identity.
_IDENTITY_LINE_RE = re.compile(
    r"^\s*(?:gender|sex|marital\s+status|religion|caste|ethnicity|nationality|"
    r"citizenship(?:\s+no\.?)?|date\s+of\s+birth|d\.?o\.?b\.?|age|father'?s\s+name|"
    r"mother'?s\s+name|spouse|husband'?s\s+name|wife'?s\s+name|address|"
    r"permanent\s+address|temporary\s+address|hometown|"
    r"लिङ्ग|लिंग|उमेर|जन्म\s*मिति|धर्म|जात|जाति|वैवाहिक\s*स्थिति|ठेगाना|"
    r"स्थायी\s*ठेगाना|अस्थायी\s*ठेगाना|बुबाको\s*नाम|आमाको\s*नाम|नागरिकता)"
    r"\s*[:：\-–].*$",
    re.IGNORECASE | re.MULTILINE,
)
_PRONOUNS = {
    "he": "they",
    "she": "they",
    "him": "them",
    "her": "their",
    "his": "their",
    "hers": "theirs",
    "himself": "themself",
    "herself": "themself",
}
_PRONOUN_RE = re.compile(r"\b(" + "|".join(_PRONOUNS) + r")\b", re.IGNORECASE)
_HONORIFIC_RE = re.compile(
    r"\b(?:mr|mrs|ms|miss|mx)\.?\s+|(?:श्रीमान्?|श्रीमती|सुश्री|सुश्री)\s*", re.IGNORECASE
)
_AGE_RE = re.compile(
    r"\b\d{1,2}\s*(?:years?|yrs?)\s*old\b|\baged?\s*:?\s*\d{1,2}\b|"
    r"[\d०-९]{1,2}\s*वर्ष(?:को)?\s*(?:उमेर)",
    re.IGNORECASE,
)
_MONTHS = (
    r"jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|"
    r"aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|"
    r"baisakh|jestha|ashadh|shrawan|bhadra|ashwin|kartik|mangsir|poush|magh|"
    r"falgun|chaitra"
)
_DATE_RE = re.compile(
    r"\b\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4}\b|"  # 2019-05-01, 01/05/2019
    rf"\b(?:{_MONTHS})\.?\s*,?\s*(?:\d{{1,2}},?\s*)?(?:19|20)\d{{2}}\b|"  # May 2019
    r"\b(?:19|20)\d{2}\b|"  # bare years (AD and BS)
    r"[०-९]{4}(?:\s*[/.-]\s*[०-९]{1,2}){0,2}",  # Devanagari years/dates
    re.IGNORECASE,
)
_INSTITUTION_WORDS = (
    r"University|College|Campus|Institute|Institution|School|Academy|Polytechnic|"
    r"Vidyalaya|Mahavidyalaya|Vidyashram|Gurukul"
)
_INSTITUTION_RE = re.compile(
    rf"(?:\b(?:[A-Z][\w.&'-]*\s+){{0,5}}(?:{_INSTITUTION_WORDS})\b"
    rf"(?:\s+of(?:\s+[A-Z][\w.&'-]*){{1,4}})?)|"
    rf"(?:\b(?:{_INSTITUTION_WORDS})\s+of(?:\s+[A-Z][\w.&'-]*){{1,4}})|"
    r"(?:(?:[^\s,।]+\s+){0,3}(?:विश्वविद्यालय|क्याम्पस|महाविद्यालय|माध्यमिक\s+विद्यालय|विद्यालय|कलेज))"
)
# A must-have that names a credential lets institution names through.
_CREDENTIAL_RE = re.compile(
    r"degree|bachelor|master|\bmba\b|\bbba\b|\bbbs\b|\bbsc\b|\bmsc\b|\bphd\b|diploma|"
    r"certif|licen[cs]e|chartered|\bca\b|\bacca\b|\bcpa\b|registered|registration|"
    r"\bnnc\b|\btsc\b|\bnpc\b|\bnmc\b|\bican\b|council|university|college|institute|"
    r"\bsee\b|\bslc\b|\+2|plus two|डिग्री|स्नातक|प्रमाणपत्र|लाइसेन्स|अनुमतिपत्र|दर्ता",
    re.IGNORECASE,
)


def credential_required(must_haves: list[str] | None) -> bool:
    return any(_CREDENTIAL_RE.search(item or "") for item in must_haves or [])


def _name_tokens(full_name: str | None) -> list[str]:
    if not full_name:
        return []
    parts = [p for p in re.split(r"\s+", full_name.strip()) if len(p) >= 3]
    return sorted({full_name.strip(), *parts}, key=len, reverse=True)


def redact(text: str | None, *, names: list[str], keep_institutions: bool) -> str:
    """Remove identity from one free-text field."""
    if not text:
        return ""
    text = strip_invisible(text)
    text = _IDENTITY_LINE_RE.sub("", text)
    text = _EMAIL_RE.sub("[email]", text)
    text = _URL_RE.sub("[link]", text)
    text = _AGE_RE.sub("[age]", text)
    text = _DATE_RE.sub("[date]", text)
    text = _PHONE_RE.sub("[phone]", text)
    for token in names:
        text = re.sub(
            rf"(?<!\w){re.escape(token)}(?!\w)", "[name]", text, flags=re.IGNORECASE
        )
    text = _HONORIFIC_RE.sub("", text)
    text = _PRONOUN_RE.sub(lambda m: _PRONOUNS[m.group(1).lower()], text)
    if not keep_institutions:
        text = _INSTITUTION_RE.sub("[institution]", text)
    return re.sub(r"[ \t]+", " ", re.sub(r"\n{3,}", "\n\n", text)).strip()


def _duration(start: date | None, end: date | None) -> str:
    if start is None:
        return "duration not given"
    end_date = end or date.today()
    months = max(0, (end_date.year - start.year) * 12 + end_date.month - start.month)
    label = f"{months} mo" if months < 12 else f"{months / 12:.1f} yrs"
    return f"{label}{', current' if end is None else ''}"


def build_blind_text(
    *,
    resume: Any | None,
    answers: list[dict] | None,
    candidate_name: str | None,
    must_haves: list[str] | None,
) -> str:
    """Plain text the reviewer sees (and the text evidence quotes must come from).

    `resume` is a Resume (or an attribute-compatible stand-in) or None when the
    candidate applied without a CV.
    """
    names = _name_tokens(candidate_name)
    keep_institutions = credential_required(must_haves)

    def clean(value: str | None) -> str:
        return redact(value, names=names, keep_institutions=keep_institutions)

    lines: list[str] = []
    if resume is not None:
        headline = clean(getattr(resume, "headline", None))
        summary = clean(getattr(resume, "summary", None))
        if headline:
            lines.append(headline)
        if summary:
            lines.append(summary)
        experiences = list(getattr(resume, "experiences", None) or [])
        if experiences:
            lines.append("Work:")
            for exp in experiences:
                title = clean(exp.title) or "Role"
                company = clean(exp.company_name)
                at = f" at {company}" if company else ""
                lines.append(
                    f"- {title}{at} ({_duration(exp.start_date, exp.end_date)})"
                )
                for bullet in exp.description or []:
                    bullet = clean(bullet)
                    if bullet:
                        lines.append(f"  * {bullet}")
        educations = list(getattr(resume, "educations", None) or [])
        if educations:
            lines.append("Education:")
            for edu in educations:
                parts = [clean(edu.degree), clean(edu.field_of_study)]
                if keep_institutions:
                    parts.append(clean(edu.institution))
                text = ", ".join(p for p in parts if p)
                if text:
                    lines.append(f"- {text}")
        skills = [
            clean(s.skill_name)
            for s in getattr(resume, "skills", None) or []
            if s.skill_name
        ]
        if skills:
            lines.append("Skills: " + ", ".join(s for s in skills if s))

    answered = [a for a in answers or [] if str(a.get("answer") or "").strip()]
    if answered:
        lines.append("Answers to the job's questions:")
        for item in answered:
            lines.append(f"- Q: {clean(str(item.get('question') or ''))}")
            lines.append(f"  A: {clean(str(item.get('answer') or ''))}")
    return "\n".join(lines).strip()


def candidate_text_for_guardrail(resume: Any | None, answers: list[dict] | None) -> str:
    """Every candidate-controlled text field, unredacted, for the injection rail."""
    parts: list[str] = []
    if resume is not None:
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
        for exp in getattr(resume, "experiences", None) or []:
            parts.extend(str(v) for v in (exp.title, exp.company_name) if v)
            parts.extend(str(b) for b in exp.description or [])
        for edu in getattr(resume, "educations", None) or []:
            parts.extend(
                str(v) for v in (edu.institution, edu.degree, edu.field_of_study) if v
            )
        parts.extend(
            str(s.skill_name)
            for s in getattr(resume, "skills", None) or []
            if s.skill_name
        )
    for item in answers or []:
        if item.get("answer"):
            parts.append(str(item["answer"]))
    return "\n".join(parts)

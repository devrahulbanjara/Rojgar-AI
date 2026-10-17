"""Deterministic parts of the review: evidence checks, fit, rank, knockouts.

The model only reads the CV and quotes it. Everything that decides how a
candidate is shown (fit bucket, order) is computed here, in code.
"""

from __future__ import annotations

import re
from typing import Any

from app.shared.enums import CheckResult, Fit
from app.shared.unicode_text import match_key

SUMMARY_MAX = 140
_MIN_QUOTE_CHARS = 3
_ELLIPSIS_RE = re.compile(r"\s*(?:\.\.\.|…)\s*")
_RESULT_POINTS = {CheckResult.met.value: 1.0, CheckResult.partly.value: 0.5}


def verify_quote(quote: str | None, source: str) -> bool:
    """True when every fragment of `quote` appears in `source`.

    Case-, whitespace- and Unicode-form-insensitive (NFC both sides). A model
    may join two passages with "..."; each fragment must then be present.
    """
    if not quote:
        return False
    haystack = match_key(source)
    fragments = [
        match_key(part) for part in _ELLIPSIS_RE.split(quote.strip().strip("\"'“”‘’"))
    ]
    fragments = [f for f in fragments if f]
    if not fragments or sum(len(f) for f in fragments) < _MIN_QUOTE_CHARS:
        return False
    return all(f in haystack for f in fragments)


def build_checks(
    criteria: list[tuple[str, str]],
    raw: dict[int, dict[str, Any]],
    source: str,
) -> list[dict]:
    """Merge model output with the job's criteria and enforce "no quote, no credit".

    `criteria` is [(kind, text)] with kind "must" or "nice"; `raw` maps the
    criterion index to {"result", "evidence"} from the model. Evidence that is
    not found in `source` is dropped, and a met/partly claim without verified
    evidence becomes "missing".
    """
    checks: list[dict] = []
    for index, (kind, criterion) in enumerate(criteria):
        item = raw.get(index) or {}
        result = str(item.get("result") or CheckResult.missing.value)
        if result not in _RESULT_POINTS and result != CheckResult.missing.value:
            result = CheckResult.missing.value
        evidence = (item.get("evidence") or "").strip() or None
        if evidence is not None and not verify_quote(evidence, source):
            evidence = None
        if evidence is None:
            result = CheckResult.missing.value
        checks.append(
            {
                "criterion": criterion,
                "kind": kind,
                "result": result,
                "evidence": evidence if result != CheckResult.missing.value else None,
            }
        )
    return checks


def coverage(checks: list[dict], kind: str = "must") -> float | None:
    """Share of `kind` criteria covered (met = 1, partly = 0.5); None if none."""
    scoped = [c for c in checks if c.get("kind") == kind]
    if not scoped:
        return None
    return sum(_RESULT_POINTS.get(c["result"], 0.0) for c in scoped) / len(scoped)


def derive_fit(checks: list[dict]) -> str | None:
    """strong: every must-have met; possible: at least half covered; else weak.

    Partly counts as half. Without must-haves the nice-to-haves decide; with no
    criteria at all there is no fit.
    """
    kind = "must" if any(c.get("kind") == "must" for c in checks) else "nice"
    scoped = [c for c in checks if c.get("kind") == kind]
    if not scoped:
        return None
    if all(c["result"] == CheckResult.met.value for c in scoped):
        return Fit.strong.value
    if (coverage(checks, kind) or 0.0) >= 0.5:
        return Fit.possible.value
    return Fit.weak.value


def rank_score(checks: list[dict], tiebreak: float | None) -> float:
    """Sort key within a fit bucket: rubric points first, ML signal breaks ties.

    Rubric: must-haves weigh 2, nice-to-haves 1 (0-100). The tie-break is in
    [0, 1) so it can never lift anyone past a candidate with more evidence.
    """
    weights = {"must": 2.0, "nice": 1.0}
    total = sum(weights.get(c.get("kind"), 0.0) for c in checks)
    earned = sum(
        weights.get(c.get("kind"), 0.0) * _RESULT_POINTS.get(c["result"], 0.0)
        for c in checks
    )
    rubric = 100.0 * earned / total if total else 0.0
    signal = 0.5 if tiebreak is None else max(0.0, min(1.0, tiebreak))
    return round(rubric + 0.99 * signal, 4)


def cap_summary(text: str | None) -> str | None:
    """One line, at most 140 characters, cut on a word boundary."""
    if not text:
        return None
    line = " ".join(text.split())
    if len(line) <= SUMMARY_MAX:
        return line or None
    cut = line[: SUMMARY_MAX - 1].rsplit(" ", 1)[0].rstrip(",;:-")
    return f"{cut}…"


def _yes_no(value: str | None) -> str | None:
    key = match_key(value or "")
    if key in {"yes", "y", "ho", "हो", "छ", "cha", "chha", "हुन्छ", "true"}:
        return "yes"
    if key in {"no", "n", "haina", "होइन", "छैन", "chaina", "chhaina", "false"}:
        return "no"
    return None


def failed_knockouts(
    questions: list[dict] | None, answers: list[dict] | None
) -> list[dict]:
    """Knockout questions answered the wrong way (deterministic, no LLM).

    A question is a knockout when it is yes/no and sets `knockout_answer`.
    Missing or unclear answers never knock anyone out.
    """
    given = {
        match_key(str(a.get("question") or "")): a.get("answer") for a in answers or []
    }
    failed: list[dict] = []
    for question in questions or []:
        expected = question.get("knockout_answer")
        if question.get("type") != "yes_no" or expected not in {"yes", "no"}:
            continue
        answer = given.get(match_key(str(question.get("label") or "")))
        normalized = _yes_no(str(answer) if answer is not None else None)
        if normalized is not None and normalized != expected:
            failed.append({"question": question["label"], "answer": str(answer)})
    return failed

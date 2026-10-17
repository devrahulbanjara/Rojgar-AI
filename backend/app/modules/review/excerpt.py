"""Keep long applications inside a token budget before a model reads them.

Free-tier models allow only a few thousand tokens a minute, so a four-page CV
must not be sent whole (twice: quick pass and full review). Short applications
go as they are. Long ones are cut to the passages that best match the job's
criteria, picked locally with the search embedding model (no API call), and
kept in their original order. The answers to the job's questions are always
kept. Every passage is copied verbatim, so quotes still verify against the
full application text.
"""

from __future__ import annotations

import math

from loguru import logger

# About 1,000-1,300 tokens of application text per model call.
MAX_CHARS = 4000
# The answers section is evidence too, but a wall of text there is capped.
MAX_ANSWER_CHARS = 1500
ANSWERS_HEADER = "Answers to the job's questions:"


def _blocks(text: str) -> list[str]:
    """Top-level lines with their indented children ("  * bullet", "  A: ...")."""
    blocks: list[str] = []
    for line in text.splitlines():
        if not line.strip():
            continue
        if blocks and line.startswith("  "):
            blocks[-1] += "\n" + line
        else:
            blocks.append(line)
    return blocks


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b, strict=False))
    norm = math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b))
    return dot / norm if norm else 0.0


async def _ranked(blocks: list[str], criteria: list[str]) -> list[int]:
    """Block indexes, taking each criterion's best match in turn (round robin),
    so every criterion gets its strongest passage before any gets a second."""
    from app.infrastructures.ai.service import ai_service

    try:
        passages = await ai_service.embed_many(blocks, "passage")
        queries = await ai_service.embed_many(criteria, "query")
    except Exception as exc:  # noqa: BLE001 - fall back to reading order
        logger.warning("Review excerpt without embeddings: {}", type(exc).__name__)
        return list(range(len(blocks)))
    per_criterion = [
        sorted(range(len(blocks)), key=lambda i, q=q: -_cosine(q, passages[i]))
        for q in queries
    ]
    order: list[int] = []
    for rank in range(len(blocks)):
        for ranking in per_criterion:
            index = ranking[rank]
            if index not in order:
                order.append(index)
    return order


async def for_review(text: str, criteria: list[tuple[str, str]]) -> str:
    """`text` if it fits the budget, else its best-matching passages."""
    if len(text) <= MAX_CHARS:
        return text
    body, _, answers = text.partition(ANSWERS_HEADER)
    answers_part = (ANSWERS_HEADER + answers)[:MAX_ANSWER_CHARS] if answers else ""
    blocks = _blocks(body)
    budget = MAX_CHARS - len(answers_part)
    # The first block (headline or summary) frames everything else.
    chosen, used = {0}, len(blocks[0]) if blocks else 0
    names = [criterion for _kind, criterion in criteria]
    order = await _ranked(blocks, names) if names else list(range(len(blocks)))
    for index in order:
        size = len(blocks[index]) + 1
        if index not in chosen and used + size <= budget:
            chosen.add(index)
            used += size
    kept = "\n".join(blocks[i] for i in sorted(chosen) if blocks)
    logger.info(
        "Review excerpt: {} of {} characters, {} of {} passages",
        len(kept) + len(answers_part),
        len(text),
        len(chosen),
        len(blocks),
    )
    return f"{kept}\n{answers_part}".strip()

"""Adapters that drive the REAL scoring code paths in-process.

Nothing here re-implements scoring. We only:
  * hand the production functions attribute-compatible stand-in objects, and
  * wrap ``ai_service.get_embeddings`` with a disk cache + spend meter, so
    re-runs are free and every scorer input can be hashed for comparison.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
from pathlib import Path
from types import SimpleNamespace
from typing import Any

from langchain_core.callbacks import AsyncCallbackHandler

from simulation.safety import EST, PRICE, Budget

CACHE_DIR = Path(__file__).resolve().parent / "reports" / ".cache"

# Groq on-demand tier: 8k tokens/minute, and requests are charged for
# prompt + max_tokens up front. One Groq call at a time, with backoff.
_GROQ_LOCK = asyncio.Lock()
EMBED_PACE_SECONDS = 2.0  # ≤30 uncached embedding calls/minute
_FAIL_OPEN_EVENTS: list[str] = []
_SINK_INSTALLED = False


def _install_fail_open_sink() -> None:
    """Count the production guardrail's silent fail-open events (it returns SAFE on errors)."""
    global _SINK_INSTALLED
    if _SINK_INSTALLED:
        return
    from loguru import logger

    def sink(message) -> None:
        text = str(message)
        if "Failing open" in text:
            _FAIL_OPEN_EVENTS.append(text.strip()[:240])

    logger.add(sink, level="WARNING")
    _SINK_INSTALLED = True


def fail_open_events() -> list[str]:
    return list(_FAIL_OPEN_EVENTS)


def text_hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:16]


class _FakeDB:
    """Just enough AsyncSession surface for ``_compute_resume_embedding``."""

    def __init__(self, resume: Any) -> None:
        self._resume = resume

    async def scalar(self, _stmt: Any) -> Any:
        return self._resume


class Instrumented:
    """Process-wide hooks around external calls."""

    def __init__(self, budget: Budget) -> None:
        self.budget = budget
        self.embedded_texts: dict[str, str] = {}  # hash -> text
        self.last_embedded_hash: str | None = None
        self.embed_rate_limited = 0
        self.rate_limited = 0  # Groq 429s absorbed by harness retries
        self.fail_open = 0  # production guardrail fail-open events observed
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        self._embed_cache_path = CACHE_DIR / "embeddings.json"
        self._embed_cache: dict[str, list[float]] = {}
        if self._embed_cache_path.exists():
            self._embed_cache = json.loads(self._embed_cache_path.read_text())
        self._install_embedding_hook()

    def _install_embedding_hook(self) -> None:
        from app.infrastructures.ai.service import ai_service

        original = ai_service.get_embeddings
        cache = self._embed_cache

        async def get_embeddings(text: str) -> list[float]:
            key = text_hash(text)
            self.embedded_texts[key] = text
            self.last_embedded_hash = key
            if key in cache:
                return cache[key]
            # Free-tier Gemini embedding quota is 100 req/min per project and may
            # be shared with a live deployment: pace well below it, back off on 429.
            vector = None
            for attempt in range(6):
                await asyncio.sleep(EMBED_PACE_SECONDS)
                try:
                    vector = await original(text)
                    break
                except Exception as exc:
                    if "RESOURCE_EXHAUSTED" not in str(exc) or attempt == 5:
                        raise
                    self.embed_rate_limited += 1
                    await asyncio.sleep(45)
            assert vector is not None
            self.budget.charge("embedding", max(1, len(text) // 4) * PRICE["embed_in"])
            cache[key] = vector
            return vector

        ai_service.get_embeddings = get_embeddings  # type: ignore[method-assign]

    def flush(self) -> None:
        self._embed_cache_path.write_text(json.dumps(self._embed_cache))


async def embed_job(job: SimpleNamespace) -> str:
    from app.modules.jobs.service import _compute_and_store_jd_embedding

    await _compute_and_store_jd_embedding(job)
    from app.infrastructures.qdrant.service import qdrant_service

    return text_hash(qdrant_service._build_job_document(job))


async def embed_application(app: SimpleNamespace, inst: Instrumented) -> str:
    """Run the production resume-embedding builder; return the hash of its input text."""
    from app.modules.applications.service import _compute_resume_embedding

    app.resume_embedding = await _compute_resume_embedding(
        _FakeDB(app.resume), app.resume.id
    )
    assert inst.last_embedded_hash is not None
    return inst.last_embedded_hash


def ml_score(
    job: SimpleNamespace, apps: list[SimpleNamespace]
) -> tuple[list[float], list[list[float]]]:
    from app.modules.shortlisting import ml_bouncer

    if ml_bouncer._load_model() is None:
        raise SystemExit("ML bouncer model file missing; cannot audit scores")
    features = [ml_bouncer.extract_features(job, a) for a in apps]
    probs = ml_bouncer.score_applications(job, apps)
    return probs, features


def ml_input_hash(job: SimpleNamespace, app: SimpleNamespace, embed_hash: str) -> str:
    """Hash of everything the ML bouncer reads for this application."""
    from app.modules.shortlisting import ml_bouncer

    r = app.resume
    blob = json.dumps(
        [
            ml_bouncer._build_resume_text(app),
            embed_hash,
            r.years_of_experience,
            len(r.experiences),
            len(r.educations),
            len(r.skills),
        ],
        default=str,
    )
    return text_hash(blob)


def gap_payload_hash(resume: SimpleNamespace) -> str:
    from app.modules.resume_gap.service import _serialize_resume

    return text_hash(json.dumps(_serialize_resume(resume), default=str, sort_keys=True))


def shortlisting_payload_hash(job: SimpleNamespace, app: SimpleNamespace) -> str:
    from app.agents.shortlisting.service import stringify_job, stringify_resume

    return text_hash(stringify_job(job) + "\n" + stringify_resume(app))


async def gap_analysis(
    job: SimpleNamespace, resume: SimpleNamespace, inst: Instrumented
) -> dict:
    """Production gap-analysis provider + grounding filter (guardrail skipped by caller)."""
    from fastapi import HTTPException

    from app.modules.resume_gap.helpers import filter_grounded
    from app.modules.resume_gap.service import (
        _provider,
        _serialize_job,
        _serialize_resume,
    )

    resume_payload = _serialize_resume(resume)
    job_payload = _serialize_job(job)
    result = None
    async with _GROQ_LOCK:
        for attempt in range(10):
            try:
                result = await _provider.analyze_gaps(
                    resume_data=resume_payload, job_data=job_payload
                )
                break
            except HTTPException as exc:
                if exc.status_code != 429 or attempt == 9:
                    raise
                inst.rate_limited += 1
                await asyncio.sleep(20)
    assert result is not None
    inst.budget.charge("gap_analysis", EST["gap_analysis"])
    missing, _ = filter_grounded(result.missing_skills, resume_payload, job_payload)
    gaps, _ = filter_grounded(result.experience_gaps, resume_payload, job_payload)
    return {
        "overall_score_estimate": result.overall_score_estimate,
        "missing_skills": [m.area for m in missing],
        "experience_gaps": [g.area for g in gaps],
        "verdict": result.overall_verdict,
    }


async def guardrail(
    resume: SimpleNamespace, inst: Instrumented, source: str = "simulation"
) -> dict:
    """Production apply-time guardrail on the production flattened resume text.

    The production rail returns SAFE when Groq errors (e.g. 429). We detect
    that via its own log line, count it, and retry so the recorded verdict is
    the classifier's real answer.
    """
    from app.infrastructures.guardrails import guardrails_service
    from app.modules.resume_gap.service import resume_text_for_guardrails

    _install_fail_open_sink()
    text = resume_text_for_guardrails(resume)
    async with _GROQ_LOCK:
        for _attempt in range(10):
            before = len(_FAIL_OPEN_EVENTS)
            verdict = await guardrails_service.check_input(text, source=source)
            if len(_FAIL_OPEN_EVENTS) == before:
                break
            inst.fail_open += 1
            await asyncio.sleep(15)
        else:
            return {
                "safe": None,
                "score": None,
                "reason": "classifier unavailable (failed open 10x)",
            }
    inst.budget.charge("guardrail", EST["guardrail"])
    return {"safe": verdict.safe, "score": verdict.score, "reason": verdict.reason}


class UsageMeter(AsyncCallbackHandler):
    """Collects real token usage from every LLM call inside the LangGraph run."""

    def __init__(self) -> None:
        self.rows: list[dict] = []

    async def on_llm_end(self, response, **kwargs) -> None:  # type: ignore[override]
        for gen_list in response.generations:
            for gen in gen_list:
                msg = getattr(gen, "message", None)
                usage = getattr(msg, "usage_metadata", None) or {}
                meta = getattr(msg, "response_metadata", {}) or {}
                model = str(
                    meta.get("model_id")
                    or meta.get("model_name")
                    or meta.get("model")
                    or ""
                )
                self.rows.append(
                    {
                        "model": model,
                        "in": int(usage.get("input_tokens") or 0),
                        "out": int(usage.get("output_tokens") or 0),
                    }
                )

    def cost(self) -> float:
        total = 0.0
        for row in self.rows:
            m = row["model"].lower()
            if "haiku" in m:
                total += row["in"] * PRICE["haiku_in"] + row["out"] * PRICE["haiku_out"]
            elif "claude" in m or "anthropic" in m or "sonnet" in m:
                total += (
                    row["in"] * PRICE["sonnet_in"] + row["out"] * PRICE["sonnet_out"]
                )
            else:
                total += row["in"] * PRICE["groq_in"] + row["out"] * PRICE["groq_out"]
        return total


async def shortlisting_review(
    job: SimpleNamespace, app: SimpleNamespace, applicant_name: str, inst: Instrumented
) -> dict:
    """Run the compiled production LangGraph shortlisting workflow for one application."""
    from app.agents.shortlisting.service import (
        build_shortlisting_inputs,
        get_compiled_shortlisting_workflow,
    )

    meter = UsageMeter()
    workflow = get_compiled_shortlisting_workflow()
    inputs = build_shortlisting_inputs(job, app, applicant_name)
    result = await asyncio.wait_for(
        workflow.ainvoke(inputs, config={"callbacks": [meter]}), timeout=300
    )
    cost = meter.cost() or EST["shortlisting"]
    # Guardrail calls inside nodes bypass callbacks; add their estimate.
    cost += 2 * EST["guardrail"]
    inst.budget.charge("shortlisting", cost)
    return {
        "strengths": result.get("final_strengths") or [],
        "weaknesses": result.get("final_weaknesses") or [],
        "iterations": result.get("iteration"),
        "usd": round(cost, 4),
        "llm_calls": len(meter.rows),
    }

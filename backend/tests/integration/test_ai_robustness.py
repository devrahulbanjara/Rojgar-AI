"""AI calls: retries, Groq -> Gemini fallback, free-tier quota, no raw errors.

A scripted chat model (tests/fakes.py) stands in for each provider, so the real
agent, middleware and quota code runs.
"""

import pytest
from fastapi import HTTPException
from pydantic import BaseModel

from app.infrastructures.ai import llm, quota
from tests.fakes import ScriptedChatModel, answer, use_model


class Out(BaseModel):
    ok: bool


def _rate_limit_error(message: str = "rate limited: org_123 tokens per minute"):
    import httpx
    from groq import RateLimitError

    request = httpx.Request("POST", "https://api.groq.test")
    return RateLimitError(
        message, response=httpx.Response(429, request=request), body=None
    )


class _ServerError(Exception):
    status_code = 503


@pytest.fixture(autouse=True)
def _fast_retries(monkeypatch):
    monkeypatch.setattr(llm, "_RETRY_FIRST_DELAY_SECONDS", 0.01)


async def test_transient_errors_are_retried(monkeypatch):
    model = use_model(monkeypatch, _ServerError(), _ServerError(), answer(Out, ok=True))
    out, usage = await llm.generate_structured("sys", "hi", Out)
    assert out.ok and len(model.calls) == 3  # two failures, then the answer
    assert usage.model == "scripted"


async def test_a_model_that_keeps_answering_wrong_stops(monkeypatch):
    use_model(monkeypatch, default=answer(Out, ok="not a boolean"))
    with pytest.raises(HTTPException) as err:
        await llm.generate_structured("sys", "hi", Out)
    assert err.value.status_code == 502
    assert err.value.detail == llm.AI_INVALID_MESSAGE


async def test_rate_limit_is_friendly_and_never_shows_provider_text(monkeypatch):
    use_model(monkeypatch, *[_rate_limit_error()] * 5)
    with pytest.raises(HTTPException) as err:
        await llm.generate_structured("sys", "hi", Out)
    assert err.value.status_code == 429
    assert err.value.detail == llm.AI_BUSY_MESSAGE
    assert int(err.value.headers["Retry-After"]) >= 50  # cooling for a minute


async def test_groq_rate_limit_goes_to_gemini_at_once(monkeypatch):
    from app.core.config import settings

    use_model(monkeypatch, _rate_limit_error())
    gemini = ScriptedChatModel(
        replies=[answer(Out, ok=True)], model_name="gemini-2.5-flash"
    )
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")
    monkeypatch.setattr(llm, "gemini_model", lambda **_kw: gemini)
    out, usage = await llm.generate_structured("sys", "hi", Out)
    assert out.ok and usage.model == "gemini-2.5-flash"
    # Groq is now cooling down: the next call skips it without asking.
    gemini.replies.append(answer(Out, ok=True))
    out, usage = await llm.generate_structured("sys", "hi", Out)
    assert usage.model == "gemini-2.5-flash"


async def test_budget_is_checked_before_calling():
    limits = quota.limits_for("openai/gpt-oss-120b")
    assert (limits.rpm, limits.rpd, limits.tpm) == (30, 1_000, 8_000)
    await quota.record("openai/gpt-oss-120b", 7_000)
    with pytest.raises(quota.QuotaUnavailable) as err:
        await quota.reserve("openai/gpt-oss-120b", 2_500)
    assert 0 < err.value.retry_after <= 60  # the next minute
    await quota.reserve("openai/gpt-oss-20b", 2_500)  # other model, own budget


def test_provider_retry_delays_are_read():
    groq = _rate_limit_error(
        "Rate limit reached for model `openai/gpt-oss-120b` on tokens per minute "
        "(TPM): Limit 8000, Used 7900. Please try again in 1m30.5s."
    )
    assert quota.retry_delay_seconds(groq) == pytest.approx(90.5)
    gemini = Exception("429 RESOURCE_EXHAUSTED ... 'retryDelay': '41s'")
    assert quota.retry_delay_seconds(gemini) == 41
    assert quota.retry_delay_seconds(Exception("Please try again in 450ms")) == 0.45
    assert quota.retry_delay_seconds(Exception("quota exceeded")) is None


async def test_daily_cap_cools_down_until_the_providers_reset():
    exc = _rate_limit_error("Rate limit reached on requests per day (RPD).")
    delay = await quota.cool_down("openai/gpt-oss-20b", exc)
    assert 0 < delay <= 86_400
    with pytest.raises(quota.QuotaUnavailable):
        await quota.reserve("openai/gpt-oss-20b", 100)


async def test_chat_rate_limit_key_ignores_forwarded_for():
    from starlette.requests import Request

    from app.core.security import create_tokens
    from app.modules.assistant.router import rate_limit_key

    tokens, _, _ = create_tokens("11111111-1111-1111-1111-111111111111")

    def req(xff: str) -> Request:
        return Request(
            {
                "type": "http",
                "path": "/assistant/job-draft",
                "headers": [
                    (b"authorization", f"Bearer {tokens['access_token']}".encode()),
                    (b"x-forwarded-for", xff.encode()),
                ],
                "client": ("10.0.0.1", 1234),
            }
        )

    a = await rate_limit_key(req("1.1.1.1"))
    b = await rate_limit_key(req("2.2.2.2"))
    assert a == b and a.startswith("user:11111111")


def test_candidate_relevance_uses_similarity_not_rank():
    from app.infrastructures.qdrant.service import QdrantService

    # All weakly similar: nothing should be "high" just for being ranked first.
    weak = [{"application_id": i, "score": 0.30 - i / 100} for i in range(3)]
    tagged = QdrantService._tag_relevance(weak, limit=10)
    assert tagged and all(h["relevance"] == "low" for h in tagged)

    mixed = [{"application_id": 1, "score": 0.8}, {"application_id": 2, "score": 0.1}]
    tagged = QdrantService._tag_relevance(mixed, limit=10)
    assert [h["application_id"] for h in tagged] == [1]
    assert tagged[0]["relevance"] == "high"


def test_candidate_embedding_document_has_no_identity():
    from types import SimpleNamespace

    from app.infrastructures.qdrant.service import qdrant_service
    from app.shared.enums import ApplicationStage

    application = SimpleNamespace(
        resume=None,
        user=SimpleNamespace(full_name="Nisha Sharma", email="nisha@x.com"),
        stage=ApplicationStage.new,
        screening_answers=None,
    )
    doc = qdrant_service._build_application_document(
        application, SimpleNamespace(title="Backend Engineer")
    )
    assert "Nisha" not in doc and "nisha@x.com" not in doc

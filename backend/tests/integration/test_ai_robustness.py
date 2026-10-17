"""AI call robustness: no unsafe fallbacks, no silent truncation."""

from app.modules.recruiter_chat import service as chat_service


async def test_classifier_failure_does_not_route_to_web_search(monkeypatch):
    async def boom(*_args, **_kwargs):
        raise RuntimeError("groq down")

    monkeypatch.setattr(chat_service, "_classify_intent", boom)
    intent = await chat_service._safe_classify_intent(
        "tell me about Nisha Sharma's application", {}
    )
    assert intent == chat_service.CLASSIFIER_UNAVAILABLE_INTENT
    assert intent != "recruiting_web_question"


class _Choice:
    def __init__(self, content, finish_reason="stop"):
        self.finish_reason = finish_reason
        self.message = type("M", (), {"content": content})()


class _Resp:
    def __init__(self, content, finish_reason="stop"):
        self.choices = [_Choice(content, finish_reason)]


def _rate_limit_error():
    import httpx
    from groq import RateLimitError

    request = httpx.Request("POST", "https://api.groq.test")
    return RateLimitError(
        "rate limited", response=httpx.Response(429, request=request), body=None
    )


async def test_structured_call_retries_rate_limits(monkeypatch):
    from pydantic import BaseModel

    from app.infrastructures.ai import service as ai_mod

    class Out(BaseModel):
        ok: bool

    calls = {"n": 0}

    async def create(**kwargs):
        calls["n"] += 1
        assert kwargs["temperature"] == 0.0  # deterministic by default
        if calls["n"] < 3:
            raise _rate_limit_error()
        return _Resp('{"ok": true}')

    async def no_sleep(_s):
        return None

    monkeypatch.setattr(ai_mod.asyncio, "sleep", no_sleep)
    monkeypatch.setattr(
        ai_mod.ai_service._llm_client.chat.completions, "create", create
    )
    out = await ai_mod.ai_service.generate_structured("sys", {}, Out)
    assert out.ok and calls["n"] == 3


async def test_truncated_structured_output_is_an_error(monkeypatch):
    import pytest
    from fastapi import HTTPException
    from pydantic import BaseModel

    from app.infrastructures.ai import service as ai_mod

    class Out(BaseModel):
        ok: bool

    async def create(**_kwargs):
        return _Resp('{"ok": tr', finish_reason="length")

    monkeypatch.setattr(
        ai_mod.ai_service._llm_client.chat.completions, "create", create
    )
    with pytest.raises(HTTPException) as err:
        await ai_mod.ai_service.generate_structured("sys", {}, Out)
    assert err.value.status_code == 502


async def test_chat_rate_limit_key_ignores_forwarded_for():
    from starlette.requests import Request

    from app.core.security import create_tokens
    from app.modules.recruiter_chat.router import _chat_rate_limit_identifier

    tokens, _, _ = create_tokens("11111111-1111-1111-1111-111111111111")

    def req(xff: str) -> Request:
        return Request(
            {
                "type": "http",
                "path": "/recruiter-chat/sessions",
                "headers": [
                    (b"authorization", f"Bearer {tokens['access_token']}".encode()),
                    (b"x-forwarded-for", xff.encode()),
                ],
                "client": ("10.0.0.1", 1234),
            }
        )

    a = await _chat_rate_limit_identifier(req("1.1.1.1"))
    b = await _chat_rate_limit_identifier(req("2.2.2.2"))
    assert a == b and a.startswith("user:11111111")


def test_interview_final_score_requires_a_human_score():
    from types import SimpleNamespace

    from app.modules.interviews.evaluation_service import (
        HumanAggregate,
        _compute_final_score,
    )

    schema = SimpleNamespace(human_weight=0.7, llm_weight=0.3)
    llm = SimpleNamespace(weighted_total=90.0)
    assert _compute_final_score(None, llm, schema) is None
    humans = HumanAggregate(per_criterion={}, weighted_total=60.0, evaluator_count=1)
    assert _compute_final_score(humans, llm, schema) == 69.0


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
    from app.shared.enums import ApplicationStatus

    application = SimpleNamespace(
        resume=None,
        user=SimpleNamespace(full_name="Nisha Sharma", email="nisha@x.com"),
        status=ApplicationStatus.applied,
        score=None,
        strengths=None,
        weaknesses=None,
    )
    doc = qdrant_service._build_application_document(
        application, SimpleNamespace(title="Backend Engineer")
    )
    assert "Nisha" not in doc and "nisha@x.com" not in doc

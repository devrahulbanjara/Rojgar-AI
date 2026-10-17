"""AI call robustness: no unsafe fallbacks, no silent truncation."""


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


async def test_persistent_rate_limit_is_friendly_and_bounded(monkeypatch):
    import pytest
    from fastapi import HTTPException
    from pydantic import BaseModel

    from app.infrastructures.ai import service as ai_mod

    class Out(BaseModel):
        ok: bool

    slept: list[float] = []

    async def fake_sleep(seconds):
        slept.append(seconds)

    async def always_429(**_kwargs):
        raise _rate_limit_error()

    monkeypatch.setattr(ai_mod.asyncio, "sleep", fake_sleep)
    monkeypatch.setattr(
        ai_mod.ai_service._llm_client.chat.completions, "create", always_429
    )
    with pytest.raises(HTTPException) as err:
        await ai_mod.ai_service.generate_structured("sys", {}, Out)
    assert err.value.status_code == 429
    assert err.value.detail == ai_mod.AI_BUSY_MESSAGE  # no raw provider text
    assert sum(slept) <= ai_mod._RETRY_WAIT_BUDGET_SECONDS


async def test_stream_rate_limit_is_friendly(monkeypatch):
    import pytest
    from fastapi import HTTPException

    from app.infrastructures.ai import service as ai_mod

    class FakeLLM:
        async def astream(self, _messages):
            raise _rate_limit_error()
            yield  # pragma: no cover

    monkeypatch.setattr(ai_mod.ai_service, "_build_chat_model", lambda **_kw: FakeLLM())
    with pytest.raises(HTTPException) as err:
        async for _ in ai_mod.ai_service.stream_text(
            system_prompt="s", user_payload={}
        ):
            pass
    assert err.value.status_code == 429
    assert err.value.detail == ai_mod.AI_BUSY_MESSAGE

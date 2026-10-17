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

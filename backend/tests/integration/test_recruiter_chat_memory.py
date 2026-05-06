"""Tests for recruiter chat short-term memory (summarization layer).

These tests verify:
- State schema includes summary fields
- _maybe_summarize triggers at the right threshold
- _maybe_summarize gracefully handles LLM failures
- _build_handler_context assembles summary + recent messages
- _build_classifier_history includes summary prefix
- _append_history respects the raised hard cap
- End-to-end: summarization compresses history and preserves recent messages
"""

from unittest.mock import AsyncMock, patch

import pytest

from app.core.config import settings
from app.modules.recruiter_chat.service import (
    _append_history,
    _build_classifier_history,
    _build_handler_context,
    _maybe_summarize,
    _new_state,
)
from app.modules.recruiter_chat.schemas import ChatResponseType


# Fixtures
@pytest.fixture
def fresh_state():
    """Return a clean recruiter chat state."""
    return _new_state()


@pytest.fixture
def state_with_history():
    """Return a state pre-loaded with 45 messages (above default trigger of 40)."""
    state = _new_state()
    for i in range(45):
        role = "user" if i % 2 == 0 else "assistant"
        _append_history(state, role, f"Message number {i}")
    return state


@pytest.fixture
def state_below_trigger():
    """Return a state with 30 messages (below default trigger of 40)."""
    state = _new_state()
    for i in range(30):
        role = "user" if i % 2 == 0 else "assistant"
        _append_history(state, role, f"Message number {i}")
    return state


# State schema tests
class TestStateSchema:
    def test_new_state_has_summary_fields(self, fresh_state):
        assert "conversation_summary" in fresh_state
        assert fresh_state["conversation_summary"] is None
        assert "summary_through_turn" in fresh_state
        assert fresh_state["summary_through_turn"] == 0

    def test_new_state_has_all_expected_keys(self, fresh_state):
        expected_keys = {
            "mode",
            "history",
            "conversation_summary",
            "summary_through_turn",
            "salary_slots",
            "pending_job_match",
            "pending_edit",
            "last_job_id",
            "last_job_set_turn",
            "last_candidate_search_turn",
            "last_candidate_search_data",
            "turn",
            "state_version",
        }
        assert set(fresh_state.keys()) == expected_keys


# _append_history tests
class TestAppendHistory:
    def test_appends_message(self, fresh_state):
        _append_history(fresh_state, "user", "Hello")
        assert len(fresh_state["history"]) == 1
        assert fresh_state["history"][0]["role"] == "user"
        assert fresh_state["history"][0]["content"] == "Hello"

    def test_increments_turn_on_user_message(self, fresh_state):
        _append_history(fresh_state, "user", "Hello")
        assert fresh_state["turn"] == 1
        _append_history(fresh_state, "assistant", "Hi!")
        assert fresh_state["turn"] == 1
        _append_history(fresh_state, "user", "How are you?")
        assert fresh_state["turn"] == 2

    def test_hard_cap_at_80(self, fresh_state):
        for i in range(100):
            _append_history(fresh_state, "user", f"msg {i}")
        assert len(fresh_state["history"]) == 80
        assert fresh_state["history"][-1]["content"] == "msg 99"
        assert fresh_state["history"][0]["content"] == "msg 20"

    def test_stores_response_type(self, fresh_state):
        _append_history(
            fresh_state,
            "assistant",
            "Here are results",
            response_type=ChatResponseType.candidate_search_results,
        )
        assert fresh_state["history"][0]["response_type"] == "candidate_search_results"

    def test_stores_data(self, fresh_state):
        _append_history(
            fresh_state, "assistant", "Salary info", data={"role": "Engineer"}
        )
        assert fresh_state["history"][0]["data"] == {"role": "Engineer"}


# _maybe_summarize tests
class TestMaybeSummarize:
    async def test_no_op_below_trigger(self, state_below_trigger):
        """Should not summarize when history is below the trigger threshold."""
        original_len = len(state_below_trigger["history"])
        with patch(
            "app.modules.recruiter_chat.service._summarize_history"
        ) as mock_summarize:
            await _maybe_summarize(state_below_trigger)
            mock_summarize.assert_not_called()
        assert len(state_below_trigger["history"]) == original_len
        assert state_below_trigger["conversation_summary"] is None

    async def test_triggers_at_threshold(self, state_with_history):
        """Should summarize when history reaches the trigger threshold."""
        with patch(
            "app.modules.recruiter_chat.service._summarize_history",
            new_callable=AsyncMock,
            return_value="- Discussed jobs\n- Talked about salary",
        ) as mock_summarize:
            await _maybe_summarize(state_with_history)
            mock_summarize.assert_called_once()

        assert (
            state_with_history["conversation_summary"]
            == "- Discussed jobs\n- Talked about salary"
        )
        assert (
            len(state_with_history["history"])
            == settings.recruiter_chat_summarize_keep_messages
        )

    async def test_preserves_recent_messages(self, state_with_history):
        """After summarization, the kept messages are the most recent ones."""
        last_content = state_with_history["history"][-1]["content"]
        with patch(
            "app.modules.recruiter_chat.service._summarize_history",
            new_callable=AsyncMock,
            return_value="summary text",
        ):
            await _maybe_summarize(state_with_history)

        assert state_with_history["history"][-1]["content"] == last_content

    async def test_passes_existing_summary_to_summarizer(self):
        """When a previous summary exists, it's passed to _summarize_history."""
        state = _new_state()
        state["conversation_summary"] = "Previous context"
        for i in range(45):
            _append_history(state, "user" if i % 2 == 0 else "assistant", f"msg {i}")

        with patch(
            "app.modules.recruiter_chat.service._summarize_history",
            new_callable=AsyncMock,
            return_value="Updated summary",
        ) as mock_summarize:
            await _maybe_summarize(state)
            call_args = mock_summarize.call_args
            assert call_args[0][1] == "Previous context"

    async def test_updates_summary_through_turn(self, state_with_history):
        """summary_through_turn should be set to the current turn after summarization."""
        current_turn = state_with_history["turn"]
        with patch(
            "app.modules.recruiter_chat.service._summarize_history",
            new_callable=AsyncMock,
            return_value="summary",
        ):
            await _maybe_summarize(state_with_history)

        assert state_with_history["summary_through_turn"] == current_turn

    async def test_graceful_failure_keeps_history(self, state_with_history):
        """If summarization fails, history should be capped at 80 (not lost)."""
        original_history = list(state_with_history["history"])
        with patch(
            "app.modules.recruiter_chat.service._summarize_history",
            new_callable=AsyncMock,
            side_effect=RuntimeError("LLM unavailable"),
        ):
            await _maybe_summarize(state_with_history)

        assert state_with_history["conversation_summary"] is None
        assert len(state_with_history["history"]) <= 80
        assert state_with_history["history"][-1] == original_history[-1]

    async def test_no_double_summarize(self):
        """After summarization trims to `keep`, next call should not re-trigger."""
        state = _new_state()
        for i in range(45):
            _append_history(state, "user" if i % 2 == 0 else "assistant", f"msg {i}")

        with patch(
            "app.modules.recruiter_chat.service._summarize_history",
            new_callable=AsyncMock,
            return_value="summary",
        ) as mock_summarize:
            await _maybe_summarize(state)
            assert mock_summarize.call_count == 1
            await _maybe_summarize(state)
            assert mock_summarize.call_count == 1


# _build_handler_context tests
class TestBuildHandlerContext:
    def test_empty_state_returns_empty_string(self, fresh_state):
        assert _build_handler_context(fresh_state) == ""

    def test_includes_summary_when_present(self, fresh_state):
        fresh_state["conversation_summary"] = "- Discussed salary for engineers"
        result = _build_handler_context(fresh_state)
        assert "[Conversation context so far]" in result
        assert "Discussed salary for engineers" in result

    def test_includes_recent_messages(self, fresh_state):
        _append_history(fresh_state, "user", "What is a good salary for devs?")
        _append_history(fresh_state, "assistant", "It depends on the market.")
        result = _build_handler_context(fresh_state)
        assert "[Recent messages]" in result
        assert "What is a good salary for devs?" in result
        assert "It depends on the market." in result

    def test_limits_to_configured_message_count(self):
        state = _new_state()
        for i in range(20):
            _append_history(state, "user" if i % 2 == 0 else "assistant", f"msg {i}")

        result = _build_handler_context(state)
        limit = settings.recruiter_chat_handler_context_messages
        lines_with_role = [
            line
            for line in result.split("\n")
            if line.startswith(("user:", "assistant:"))
        ]
        assert len(lines_with_role) == limit

    def test_truncates_long_assistant_messages(self, fresh_state):
        long_msg = "x" * 500
        _append_history(fresh_state, "assistant", long_msg)
        result = _build_handler_context(fresh_state)
        assert "..." in result
        assert len(result) < 500

    def test_combines_summary_and_messages(self):
        state = _new_state()
        state["conversation_summary"] = "- Previously discussed Python roles"
        _append_history(state, "user", "Draft a rejection email")
        result = _build_handler_context(state)
        assert "[Conversation context so far]" in result
        assert "[Recent messages]" in result
        assert "Previously discussed Python roles" in result
        assert "Draft a rejection email" in result


# _build_classifier_history tests
class TestBuildClassifierHistory:
    def test_empty_state(self, fresh_state):
        result = _build_classifier_history(fresh_state)
        assert result == ""

    def test_includes_summary_prefix(self):
        state = _new_state()
        state["conversation_summary"] = "- Recruiter searched for React devs"
        _append_history(state, "user", "tell me more about the first one")
        result = _build_classifier_history(state)
        assert "[Earlier context]" in result
        assert "React devs" in result

    def test_truncates_summary_to_500_chars(self):
        state = _new_state()
        state["conversation_summary"] = "x" * 1000
        _append_history(state, "user", "hello")
        result = _build_classifier_history(state)
        context_line = [
            line for line in result.split("\n") if "[Earlier context]" in line
        ][0]
        assert len(context_line) <= 520

    def test_shows_last_6_messages(self):
        state = _new_state()
        for i in range(10):
            _append_history(state, "user" if i % 2 == 0 else "assistant", f"msg {i}")
        result = _build_classifier_history(state)
        assert "msg 4" in result
        assert "msg 9" in result
        assert "msg 3" not in result

    def test_candidate_search_results_abbreviated(self):
        state = _new_state()
        _append_history(
            state,
            "assistant",
            "Here are the candidates...",
            response_type=ChatResponseType.candidate_search_results,
        )
        result = _build_classifier_history(state)
        assert "[showed candidate search results]" in result

    def test_no_summary_only_messages(self, fresh_state):
        _append_history(fresh_state, "user", "list my jobs")
        result = _build_classifier_history(fresh_state)
        assert "[Earlier context]" not in result
        assert "list my jobs" in result


# End-to-end summarization flow test
class TestSummarizationEndToEnd:
    async def test_full_flow_summarize_then_context(self):
        """Simulate a long conversation: fill history, trigger summarize, verify context."""
        state = _new_state()

        for i in range(20):
            _append_history(state, "user", f"User message {i} about hiring")
            _append_history(state, "assistant", f"Response {i} with advice")

        assert len(state["history"]) == 40

        _append_history(state, "user", "One more message to trigger")
        assert len(state["history"]) == 41

        with patch(
            "app.modules.recruiter_chat.service._summarize_history",
            new_callable=AsyncMock,
            return_value="- Discussed 20 rounds of hiring advice\n- User asked about multiple roles",
        ):
            await _maybe_summarize(state)

        assert state["conversation_summary"] is not None
        assert "20 rounds" in state["conversation_summary"]
        assert len(state["history"]) == settings.recruiter_chat_summarize_keep_messages

        context = _build_handler_context(state)
        assert "20 rounds" in context
        assert "[Recent messages]" in context

        classifier_ctx = _build_classifier_history(state)
        assert "[Earlier context]" in classifier_ctx

    async def test_multiple_summarizations_accumulate(self):
        """Verify that repeated summarization integrates previous summary."""
        state = _new_state()

        for i in range(45):
            _append_history(
                state, "user" if i % 2 == 0 else "assistant", f"round1 msg {i}"
            )

        with patch(
            "app.modules.recruiter_chat.service._summarize_history",
            new_callable=AsyncMock,
            return_value="First summary: discussed Python roles",
        ):
            await _maybe_summarize(state)

        assert state["conversation_summary"] == "First summary: discussed Python roles"
        assert len(state["history"]) == settings.recruiter_chat_summarize_keep_messages

        for i in range(40):
            _append_history(
                state, "user" if i % 2 == 0 else "assistant", f"round2 msg {i}"
            )

        assert (
            len(state["history"]) >= settings.recruiter_chat_summarize_trigger_messages
        )

        with patch(
            "app.modules.recruiter_chat.service._summarize_history",
            new_callable=AsyncMock,
            return_value="Combined: Python roles + new React discussion",
        ) as mock_summarize:
            await _maybe_summarize(state)
            call_args = mock_summarize.call_args
            assert call_args[0][1] == "First summary: discussed Python roles"

        assert "Combined" in state["conversation_summary"]

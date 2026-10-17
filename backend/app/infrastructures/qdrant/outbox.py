"""Retry policy for the Qdrant outbox (job and application sync events).

A failed event is retried with exponential backoff (1, 2, 4, 8, 16 minutes)
and parked after ``MAX_ATTEMPTS``. The attempt count lives in the event's
``error_message`` ("attempt 2: ..." / "parked after 6 attempts: ..."), so no
schema change is needed. Parked events stay FAILED and are skipped by the
sweep; ``scripts/reindex_embeddings.py`` rebuilds the index and clears them.
"""

from __future__ import annotations

import re
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import ColumnElement, and_, or_

from app.infrastructures.ai.service import short_error
from app.shared.enums import SyncStatus

MAX_ATTEMPTS = 6
BASE_DELAY = timedelta(minutes=1)
PARKED_PREFIX = "parked after"
# Rows read per sweep; only the ones whose backoff has passed are processed.
SWEEP_SCAN = 200
SWEEP_BATCH = 50

_ATTEMPT_RE = re.compile(r"^(?:attempt|parked after) (\d+)")


def attempts_of(event: Any) -> int:
    match = _ATTEMPT_RE.match(event.error_message or "")
    return int(match.group(1)) if match else 0


def retryable(model: Any) -> ColumnElement[bool]:
    """Pending events, and failed ones that are not parked."""
    return or_(
        model.status == SyncStatus.PENDING,
        and_(
            model.status == SyncStatus.FAILED,
            or_(
                model.error_message.is_(None),
                model.error_message.not_like(f"{PARKED_PREFIX}%"),
            ),
        ),
    )


def is_due(event: Any, now: datetime | None = None) -> bool:
    """A failed event waits BASE_DELAY * 2^(attempts-1) after its last try."""
    if event.status != SyncStatus.FAILED or event.updated_at is None:
        return True
    attempts = max(1, attempts_of(event))
    wait = BASE_DELAY * (2 ** (attempts - 1))
    return event.updated_at + wait <= (now or datetime.now(UTC))


def record_failure(event: Any, exc: Exception) -> tuple[int, bool]:
    """Mark the event failed; returns (attempts so far, parked)."""
    attempts = attempts_of(event) + 1
    parked = attempts >= MAX_ATTEMPTS
    reason = short_error(exc)
    event.status = SyncStatus.FAILED
    event.error_message = (
        f"{PARKED_PREFIX} {attempts} attempts: {reason}"
        if parked
        else f"attempt {attempts}: {reason}"
    )
    return attempts, parked

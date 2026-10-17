"""Guards that keep the harness pointed at local infrastructure and inside a spend budget."""

from __future__ import annotations

import sys
from dataclasses import dataclass, field
from urllib.parse import urlparse

LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1", "0.0.0.0"}

# Rough public list prices (USD). Used for pre-run estimates and the running
# budget; real provider invoices are the source of truth.
PRICE = {
    # Groq openai/gpt-oss-120b, per token (guardrail + full review)
    "groq_in": 0.15 / 1_000_000,
    "groq_out": 0.60 / 1_000_000,
    # Groq openai/gpt-oss-20b, per token (cheap review pass)
    "groq_small_in": 0.075 / 1_000_000,
    "groq_small_out": 0.30 / 1_000_000,
}

# Per-call estimates (USD) used before we have real usage numbers.
EST = {
    "guardrail": 1_400 * PRICE["groq_in"] + 600 * PRICE["groq_out"],
    # Cheap pass + full evidence review (upper bound; implausible applicants
    # stop after the cheap pass).
    "review": 2_500 * PRICE["groq_small_in"]
    + 400 * PRICE["groq_small_out"]
    + 2_500 * PRICE["groq_in"]
    + 600 * PRICE["groq_out"],
}

CONFIRM_ABOVE_USD = 0.50


def die(message: str) -> None:
    print(f"\n[simulation] REFUSING: {message}\n", file=sys.stderr)
    raise SystemExit(2)


def assert_local_url(url: str, *, allow_remote: bool) -> None:
    host = (urlparse(url).hostname or "").lower()
    if host in LOCAL_HOSTS:
        return
    if not allow_remote:
        die(
            f"base URL {url!r} is not localhost. This harness generates real load and "
            "real accounts' traffic; pass --allow-remote only for a staging stack you own."
        )
    banner = "!" * 78
    print(
        f"\n{banner}\n!! --allow-remote: targeting {url}\n"
        "!! NEVER point this at production. Load mode can exhaust DB pools and rate limits.\n"
        f"{banner}\n",
        file=sys.stderr,
    )


def assert_local_settings() -> None:
    """In-process modes import app settings; make sure they resolve to local stores."""
    from app.core.config import settings

    if settings.environment == "prod":
        die("settings.environment == 'prod'")
    if (settings.db_host or "").lower() not in LOCAL_HOSTS:
        die(f"DB host {settings.db_host!r} is not local (check backend/.env)")
    qdrant_host = (urlparse(settings.qdrant_url).hostname or "").lower()
    if qdrant_host not in LOCAL_HOSTS:
        die(f"Qdrant URL {settings.qdrant_url!r} is not local")


@dataclass
class Budget:
    """Running spend tracker with a hard cap."""

    max_cost: float
    spent: float = 0.0
    calls: dict[str, int] = field(default_factory=dict)

    def charge(self, kind: str, usd: float) -> None:
        self.calls[kind] = self.calls.get(kind, 0) + 1
        self.spent += usd
        if self.spent > self.max_cost:
            die(
                f"spend {self.spent:.4f} USD exceeded --max-cost {self.max_cost:.2f}; "
                "results so far were not written"
            )

    def summary(self) -> dict:
        return {"estimated_usd": round(self.spent, 4), "calls": dict(self.calls)}


def confirm_estimate(estimate: float, *, yes: bool, max_cost: float) -> None:
    print(
        f"[simulation] estimated LLM/API spend: ~${estimate:.3f} (cap ${max_cost:.2f})"
    )
    if estimate > max_cost:
        die(f"estimate ${estimate:.2f} is above --max-cost ${max_cost:.2f}")
    if estimate > CONFIRM_ABOVE_USD and not yes:
        die(f"estimate is above ${CONFIRM_ABOVE_USD:.2f}; re-run with --yes to confirm")

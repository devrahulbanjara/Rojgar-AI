"""Concurrent persona journeys against a running LOCAL backend over HTTP."""

from __future__ import annotations

import asyncio
import json
import random
import statistics
import time
from collections import Counter, defaultdict
from pathlib import Path

import httpx

from simulation.personas import generate_personas

PASSWORD = "Password@123"
E2E_PASSWORD = "Password123"
BACKEND_DIR = Path(__file__).resolve().parents[1]


def _seeded_accounts() -> dict[str, list[tuple[str, str]]]:
    creds = json.loads((BACKEND_DIR / "credentials.json").read_text())
    pwd = creds.get("default_password", PASSWORD)
    out: dict[str, list[tuple[str, str]]] = {"candidate": [], "recruiter": []}
    for acc in creds["accounts"]:
        role = acc.get("primary_role")
        if role == "candidate":
            out["candidate"].append((acc["email"], pwd))
        elif (
            role in ("recruiter", "recruiter_admin")
            and acc.get("membership_status", "active") == "active"
        ):
            out["recruiter"].append((acc["email"], pwd))
    return out


class Stats:
    def __init__(self) -> None:
        self.lat: dict[str, list[float]] = defaultdict(list)
        self.codes: dict[str, Counter] = defaultdict(Counter)
        self.samples_5xx: list[dict] = []
        self.timeline: list[tuple[float, str, int]] = []
        self.t0 = time.monotonic()

    def record(self, name: str, status: int, ms: float, body: str = "") -> None:
        self.lat[name].append(ms)
        self.codes[name][status] += 1
        self.timeline.append((time.monotonic() - self.t0, name, status))
        if status >= 500 and len(self.samples_5xx) < 15:
            self.samples_5xx.append(
                {"endpoint": name, "status": status, "body": body[:300]}
            )

    def summary(self) -> dict:
        rows = {}
        for name, values in sorted(self.lat.items()):
            values = sorted(values)
            codes = self.codes[name]
            total = sum(codes.values())
            rows[name] = {
                "n": total,
                "p50_ms": round(values[len(values) // 2], 1),
                "p95_ms": round(
                    values[min(len(values) - 1, int(len(values) * 0.95))], 1
                ),
                "max_ms": round(values[-1], 1),
                "status_codes": dict(codes),
                "error_rate": round(
                    sum(v for k, v in codes.items() if k >= 500 or k == 0) / total, 3
                ),
                "rate_limited": codes.get(429, 0),
            }
        return rows


class Client:
    def __init__(
        self,
        http: httpx.AsyncClient,
        stats: Stats,
        limiter: RateCap,
        fake_ip: str | None,
    ):
        self.http = http
        self.stats = stats
        self.limiter = limiter
        self.fake_ip = fake_ip
        self.token: str | None = None

    async def call(
        self, name: str, method: str, url: str, **kw
    ) -> httpx.Response | None:
        await self.limiter.wait()
        headers = kw.pop("headers", {})
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        if self.fake_ip:
            headers["X-Forwarded-For"] = self.fake_ip
        t = time.monotonic()
        try:
            resp = await self.http.request(method, url, headers=headers, **kw)
        except httpx.HTTPError as exc:
            self.stats.record(name, 0, (time.monotonic() - t) * 1000, repr(exc))
            return None
        self.stats.record(
            name, resp.status_code, (time.monotonic() - t) * 1000, resp.text
        )
        return resp


class RateCap:
    """Global requests-per-second cap shared by every persona."""

    def __init__(self, rps: float) -> None:
        self.interval = 1.0 / rps if rps > 0 else 0.0
        self._next = time.monotonic()
        self._lock = asyncio.Lock()

    async def wait(self) -> None:
        if not self.interval:
            return
        async with self._lock:
            now = time.monotonic()
            delay = max(0.0, self._next - now)
            self._next = max(now, self._next) + self.interval
        if delay:
            await asyncio.sleep(delay)


async def candidate_journey(
    c: Client, rng: random.Random, include_ai: bool, job_ids: list[str]
) -> None:
    await c.call("GET /jobs/ (browse)", "GET", "/jobs/", params={"page": 1, "size": 20})
    if job_ids:
        await c.call("GET /jobs/{id}", "GET", f"/jobs/{rng.choice(job_ids)}")
    await c.call("GET /applications/me", "GET", "/applications/me")
    await c.call("GET /resumes/me", "GET", "/resumes/me")
    await c.call("GET /dashboards/candidate", "GET", "/dashboards/candidate")
    await c.call("GET /notifications", "GET", "/notifications")
    if include_ai:
        q = rng.choice(
            [
                "python backend",
                "flutter mobile",
                "data engineer airflow",
                "devops kubernetes",
            ]
        )
        await c.call(
            "GET /jobs/?q= (semantic)",
            "GET",
            "/jobs/",
            params={"q": q, "page": 1, "size": 20},
        )


async def recruiter_journey(c: Client, rng: random.Random, mutate: bool) -> None:
    await c.call("GET /dashboards/recruiter", "GET", "/dashboards/recruiter")
    await c.call("GET /jobs/company/me", "GET", "/jobs/company/me")
    resp = await c.call(
        "GET /applications/company/me/candidates",
        "GET",
        "/applications/company/me/candidates",
        params={"page": 1, "size": 20},
    )
    items: list[dict] = []
    if resp is not None and resp.status_code == 200:
        data = resp.json().get("data")
        items = data.get("items", []) if isinstance(data, dict) else (data or [])
    if not items:
        return
    pick = rng.choice(items)
    app_id = pick.get("latest_application_id") or pick.get("application_id")
    job_id = pick.get("primary_job_id")
    if not app_id:
        return
    if job_id:
        await c.call(
            "GET /recruiter/v2/jobs/{id}/pipeline",
            "GET",
            f"/recruiter/v2/jobs/{job_id}/pipeline",
        )
    await c.call(
        "GET /recruiter/v2/applications/{id}",
        "GET",
        f"/recruiter/v2/applications/{app_id}",
    )
    if mutate:
        # Decide, then undo inside the window: nothing is emailed, stage restored.
        action = "shortlist" if pick.get("latest_stage") == "new" else "reject"
        r = await c.call(
            "POST /recruiter/v2/decide",
            "POST",
            "/recruiter/v2/decide",
            json={"action": action, "application_ids": [app_id]},
        )
        if r is not None and r.status_code == 200:
            event_ids = r.json()["data"].get("undo_event_ids") or []
            if event_ids:
                await c.call(
                    "POST /recruiter/v2/undo",
                    "POST",
                    "/recruiter/v2/undo",
                    json={"event_ids": event_ids},
                )


async def mint_tokens(db_name: str) -> dict[str, list[str]]:
    """Mint access JWTs in-process for seeded users (no /auth/login traffic).

    Uses the app's own ``create_tokens`` and SECRET_KEY, so the tokens are
    exactly what a real login would hand out. Local DB only.
    """
    from sqlalchemy import select, text
    from sqlalchemy.ext.asyncio import create_async_engine

    import app.core.model_registry  # noqa: F401 - register all mappers
    from app.core.config import settings
    from app.core.security import create_tokens
    from app.modules.auth.models import User

    accounts = _seeded_accounts()
    url = settings.database_url.rsplit("/", 1)[0] + f"/{db_name}"
    engine = create_async_engine(url)
    out: dict[str, list[str]] = {"candidate": [], "recruiter": []}
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
        for role, creds in accounts.items():
            emails = [e for e, _ in creds]
            rows = (
                await conn.execute(select(User.id).where(User.email.in_(emails)))
            ).all()
            out[role] = [create_tokens(str(r[0]))[0]["access_token"] for r in rows]
    await engine.dispose()
    return out


async def run(
    *,
    base_url: str,
    personas: int,
    ramp_seconds: float,
    max_rps: float,
    include_ai: bool,
    mutate: bool,
    login_sample: int,
    db_name: str,
    seed: int,
) -> dict:
    accounts = _seeded_accounts()
    tokens = await mint_tokens(db_name)
    if not tokens["candidate"] or not tokens["recruiter"]:
        raise SystemExit(
            f"no seeded users found in DB {db_name!r}; run seed_data.py there first"
        )
    people = generate_personas(personas, seed=seed)
    stats = Stats()
    cap = RateCap(max_rps)
    limits = httpx.Limits(max_connections=200, max_keepalive_connections=50)
    async with httpx.AsyncClient(base_url=base_url, timeout=60, limits=limits) as http:
        # Discover job ids anonymously once (counts toward stats).
        probe = Client(http, stats, cap, None)
        r = await probe.call(
            "GET /jobs/ (browse)", "GET", "/jobs/", params={"page": 1, "size": 50}
        )
        job_ids = [
            j["id"]
            for j in (
                r.json()["data"]["items"]
                if r is not None and r.status_code == 200
                else []
            )
        ]
        # A handful of real logins, spread out, so login latency is measured
        # without hammering the shared per-IP limiter.
        for k in range(login_sample):
            email, pwd = accounts["candidate"][k % len(accounts["candidate"])]
            await probe.call(
                "POST /auth/login",
                "POST",
                "/auth/login",
                json={"email": email, "password": pwd},
            )
            await asyncio.sleep(7)

        async def persona_task(i: int, p) -> None:
            await asyncio.sleep(ramp_seconds * i / max(1, personas))
            rng = random.Random(seed + i)
            c = Client(http, stats, cap, None)
            pool = tokens[p.role]
            c.token = pool[i % len(pool)]
            if p.role == "candidate":
                await candidate_journey(c, rng, include_ai, job_ids)
            else:
                await recruiter_journey(c, rng, mutate)

        t0 = time.monotonic()
        await asyncio.gather(*(persona_task(i, p) for i, p in enumerate(people)))
        wall = time.monotonic() - t0

    summary = stats.summary()
    total = sum(v["n"] for v in summary.values())
    errors = sum(
        sum(
            c
            for code, c in v["status_codes"].items()
            if int(code) >= 500 or int(code) == 0
        )
        for v in summary.values()
    )
    all_lat = sorted(x for v in stats.lat.values() for x in v)
    return {
        "mode": "load",
        "config": {
            "base_url": base_url,
            "personas": personas,
            "roles": dict(Counter(p.role for p in people)),
            "ramp_seconds": ramp_seconds,
            "max_rps": max_rps,
            "include_ai": include_ai,
            "mutate": mutate,
            "auth": "access tokens minted in-process via app.core.security.create_tokens",
            "login_sample": login_sample,
            "db_name": db_name,
            "accounts": {k: len(v) for k, v in tokens.items()},
        },
        "overall": {
            "requests": total,
            "wall_seconds": round(wall, 1),
            "throughput_rps": round(total / wall, 1) if wall else None,
            "p50_ms": round(statistics.median(all_lat), 1) if all_lat else None,
            "p95_ms": round(all_lat[int(len(all_lat) * 0.95)], 1) if all_lat else None,
            "server_errors": errors,
            "error_rate": round(errors / total, 3) if total else None,
            "rate_limited_429": sum(v["rate_limited"] for v in summary.values()),
        },
        "endpoints": summary,
        "samples_5xx": stats.samples_5xx,
    }


async def limiter_check(
    *,
    base_url: str,
    email: str,
    password: str,
    same_ip_attempts: int,
    spoofed_attempts: int,
) -> dict:
    """Tiny controlled check: exhaust the login bucket, then retry with forged X-Forwarded-For.

    Run this against a harness-owned backend (e.g. :8002), never one a person is using:
    the bucket is per client IP and would lock them out too.
    """
    stats = Stats()
    cap = RateCap(0)
    rows: list[dict] = []
    async with httpx.AsyncClient(base_url=base_url, timeout=30) as http:
        plain = Client(http, stats, cap, None)
        for i in range(same_ip_attempts):
            r = await plain.call(
                "POST /auth/login (same IP)",
                "POST",
                "/auth/login",
                json={"email": email, "password": password},
            )
            rows.append(
                {
                    "attempt": i + 1,
                    "x_forwarded_for": None,
                    "status": r.status_code if r else 0,
                }
            )
        for i in range(spoofed_attempts):
            ip = f"203.0.113.{10 + i}"
            spoof = Client(http, stats, cap, ip)
            r = await spoof.call(
                "POST /auth/login (forged XFF)",
                "POST",
                "/auth/login",
                json={"email": email, "password": password},
            )
            rows.append(
                {
                    "attempt": same_ip_attempts + i + 1,
                    "x_forwarded_for": ip,
                    "status": r.status_code if r else 0,
                }
            )
    same = [r["status"] for r in rows if r["x_forwarded_for"] is None]
    spoofed = [r["status"] for r in rows if r["x_forwarded_for"]]
    return {
        "mode": "limiter",
        "config": {"base_url": base_url, "account": email},
        "rows": rows,
        "verdict": {
            "bucket_exhausted": 429 in same,
            "bypass_with_forged_xff": 429 in same and all(s == 200 for s in spoofed),
        },
    }

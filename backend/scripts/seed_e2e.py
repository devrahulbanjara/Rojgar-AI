"""Seed deterministic users for E2E tests.

Idempotent: re-running leaves DB in same state. Reads DB connection from env
(set by frontend e2e/run-e2e.mjs to point at docker test stack).

Run: uv run python scripts/seed_e2e.py
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

# Make `app` importable when run from backend/ as `python scripts/seed_e2e.py`.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

# Register all model classes with Base.metadata so relationship() lookups resolve.
import app.modules.auth.models  # noqa: F401
import app.modules.companies.models  # noqa: F401
import app.modules.profiles.models  # noqa: F401
import app.modules.resumes.models  # noqa: F401
import app.modules.jobs.models  # noqa: F401
import app.modules.applications.models  # noqa: F401
import app.modules.job_ai.models  # noqa: F401
import app.modules.interviews.models  # noqa: F401
import app.modules.interviews.recording_model  # noqa: F401
import app.modules.interviews.evaluation_models  # noqa: F401
import app.modules.outreach.models  # noqa: F401

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.modules.auth.enums import UserRole
from app.modules.auth.models import User

SEED_PASSWORD = "Password123"


SEED_USERS: list[dict] = [
    {
        "full_name": "E2E Candidate",
        "email": "e2e.candidate@test.dev",
        "primary_role": UserRole.candidate,
        "is_onboarded": True,
    },
    {
        "full_name": "E2E Candidate (no onboard)",
        "email": "e2e.candidate.fresh@test.dev",
        "primary_role": UserRole.candidate,
        "is_onboarded": False,
    },
    {
        "full_name": "E2E Recruiter Admin",
        "email": "e2e.recruiter@test.dev",
        "primary_role": UserRole.recruiter_admin,
        "is_onboarded": True,
    },
]


async def main() -> None:
    password_hash = hash_password(SEED_PASSWORD)
    async with AsyncSessionLocal() as db:
        created = 0
        for spec in SEED_USERS:
            res = await db.execute(select(User).where(User.email == spec["email"]))
            if res.scalar_one_or_none():
                continue
            db.add(
                User(
                    full_name=spec["full_name"],
                    email=spec["email"],
                    password_hash=password_hash,
                    primary_role=spec["primary_role"],
                    is_email_verified=True,
                    is_onboarded=spec["is_onboarded"],
                    is_deleted=False,
                )
            )
            created += 1
        await db.commit()
        print(
            f"[seed] {created} new users created, {len(SEED_USERS) - created} already existed"
        )


if __name__ == "__main__":
    asyncio.run(main())

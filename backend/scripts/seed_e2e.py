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
import app.core.model_registry  # noqa: F401
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.modules.auth.enums import BusinessStatus, MembershipRole
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership

SEED_PASSWORD = "Password123"


SEED_USERS: list[dict] = [
    {
        "full_name": "E2E Candidate",
        "email": "e2e.candidate@test.dev",
        "is_onboarded": True,
    },
    {
        "full_name": "E2E Candidate (no onboard)",
        "email": "e2e.candidate.fresh@test.dev",
        "is_onboarded": False,
    },
    {
        "full_name": "E2E Recruiter Admin",
        "email": "e2e.recruiter@test.dev",
        "is_onboarded": True,
        # Owner of an approved business.
        "owns": "E2E Business",
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
            user = User(
                full_name=spec["full_name"],
                email=spec["email"],
                password_hash=password_hash,
                is_email_verified=True,
                is_onboarded=spec["is_onboarded"],
                is_deleted=False,
            )
            db.add(user)
            if spec.get("owns"):
                company = Company(name=spec["owns"], status=BusinessStatus.active)
                db.add(company)
                await db.flush()
                db.add(
                    CompanyMembership(
                        user_id=user.id,
                        company_id=company.id,
                        role=MembershipRole.owner,
                    )
                )
            created += 1
        await db.commit()
        print(
            f"[seed] {created} new users created, {len(SEED_USERS) - created} already existed"
        )


if __name__ == "__main__":
    from app.core.destructive_guard import assert_local_target

    assert_local_target("seed_e2e.py")
    asyncio.run(main())

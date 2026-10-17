"""Give a person Rojgar AI staff access (the /admin panel), or take it away.

Run from backend/:
    uv run python scripts/make_platform_admin.py someone@example.com
    uv run python scripts/make_platform_admin.py +9779812345678
    uv run python scripts/make_platform_admin.py someone@example.com --remove
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import func, or_, select

import app.core.model_registry  # noqa: F401
from app.core.database import AsyncSessionLocal
from app.modules.auth.models import User
from app.shared.normalize import normalize_email, normalize_phone


async def main(identifier: str, remove: bool) -> int:
    phone = normalize_phone(identifier) if "@" not in identifier else None
    async with AsyncSessionLocal() as db:
        user = await db.scalar(
            select(User).where(
                or_(
                    func.lower(User.email) == normalize_email(identifier),
                    User.phone == phone if phone else False,
                ),
                User.is_deleted.is_(False),
            )
        )
        if user is None:
            print(f"No account for {identifier}. They need to sign up first.")
            return 1
        user.is_platform_admin = not remove
        await db.commit()
        state = "no longer has" if remove else "now has"
        print(f"{user.full_name or identifier} {state} platform admin access.")
        return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("identifier", help="email or phone number of the account")
    parser.add_argument("--remove", action="store_true", help="take access away")
    args = parser.parse_args()
    raise SystemExit(asyncio.run(main(args.identifier, args.remove)))

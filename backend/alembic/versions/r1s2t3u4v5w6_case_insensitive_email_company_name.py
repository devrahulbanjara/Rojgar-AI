"""case-insensitive unique email and company name

Revision ID: r1s2t3u4v5w6
Revises: q1r2s3t4u5v6
Create Date: 2026-10-17 12:00:00.000000

Emails were unique case-sensitively (A@x.com and a@x.com could be two
accounts) and company names were not unique at all, which broke join-by-name
(MultipleResultsFound) and allowed impersonating an existing company.
Existing emails are lowercased; the migration aborts with a clear message if
that would merge two accounts or if duplicate company names exist.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "r1s2t3u4v5w6"
down_revision: str | None = "q1r2s3t4u5v6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _abort_on_duplicates(bind, sql: str, what: str) -> None:
    duplicates = bind.execute(sa.text(sql)).fetchall()
    if duplicates:
        values = ", ".join(str(row[0]) for row in duplicates[:20])
        raise RuntimeError(
            f"Cannot add case-insensitive unique index: duplicate {what} "
            f"differing only by case/whitespace: {values}. Resolve them first."
        )


def upgrade() -> None:
    bind = op.get_bind()
    _abort_on_duplicates(
        bind,
        "SELECT lower(email) FROM users GROUP BY lower(email) HAVING count(*) > 1",
        "user emails",
    )
    _abort_on_duplicates(
        bind,
        "SELECT lower(name) FROM companies GROUP BY lower(name) HAVING count(*) > 1",
        "company names",
    )
    op.execute("UPDATE users SET email = lower(email) WHERE email <> lower(email)")
    op.create_index(
        "ix_users_email_lower", "users", [sa.text("lower(email)")], unique=True
    )
    op.create_index(
        "ix_companies_name_lower", "companies", [sa.text("lower(name)")], unique=True
    )


def downgrade() -> None:
    op.drop_index("ix_companies_name_lower", table_name="companies")
    op.drop_index("ix_users_email_lower", table_name="users")

"""Public apply links: job/company slugs, application source + consent, CV key,
magic-link sign-in tokens.

Revision ID: b0acfd8bc7d7
Revises: a7c3e9d1f4b2
Create Date: 2026-10-17
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "b0acfd8bc7d7"
down_revision: str | None = "a7c3e9d1f4b2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Lowercase ASCII words joined by hyphens, same shape as app.shared.slugs.slugify.
_SLUG_SQL = "trim(both '-' from regexp_replace(lower({col}), '[^a-z0-9]+', '-', 'g'))"
_NOISE_SQL = "regexp_replace({col}, '\\m(pvt|private|ltd|limited|inc|llc|corp|corporation)\\M\\.?', ' ', 'gi')"


def _slug(col: str, length: int) -> str:
    """SQL twin of app.shared.slugs.slugify."""
    full = _SLUG_SQL.format(col=col)
    # Longest prefix <= length that ends on a word boundary (else hard cut).
    return (
        f"coalesce(substring({full} from '^(.{{1,{length}}})(?:-|$)'), "
        f"left({full}, {length}))"
    )


def _company_slug(col: str, length: int) -> str:
    return _slug(_NOISE_SQL.format(col=col), length)


def upgrade() -> None:
    # Companies: careers-page slug, de-duplicated with a short id suffix.
    op.add_column("companies", sa.Column("slug", sa.String(80), nullable=True))
    op.execute(
        f"""
        UPDATE companies SET slug = {_company_slug("name", 60)}
        """
    )
    op.execute(
        """
        UPDATE companies c SET slug = c.slug || '-' || left(md5(c.id::text), 4)
        WHERE c.slug = '' OR EXISTS (
            SELECT 1 FROM companies o WHERE o.slug = c.slug AND o.id < c.id
        )
        """
    )
    op.execute(
        "UPDATE companies SET slug = 'company-' || left(md5(id::text), 6) WHERE slug LIKE '-%'"
    )
    op.alter_column("companies", "slug", nullable=False)
    op.create_unique_constraint("uq_companies_slug", "companies", ["slug"])

    # Jobs: shareable apply-link slug + screening questions.
    op.add_column("jobs", sa.Column("slug", sa.String(120), nullable=True))
    op.execute(
        f"""
        UPDATE jobs j SET slug =
            {_slug("j.title", 40)} || '-' ||
            {_company_slug("c.name", 20)} || '-' ||
            left(md5(j.id::text), 4)
        FROM companies c WHERE c.id = j.company_id
        """
    )
    op.execute(
        "UPDATE jobs SET slug = slug || left(md5(id::text || 'x'), 2) "
        "WHERE id IN (SELECT id FROM (SELECT id, row_number() OVER "
        "(PARTITION BY slug ORDER BY id) rn FROM jobs) d WHERE rn > 1)"
    )
    op.alter_column("jobs", "slug", nullable=False)
    op.create_unique_constraint("uq_jobs_slug", "jobs", ["slug"])
    op.add_column(
        "jobs",
        sa.Column(
            "screening_questions",
            postgresql.ARRAY(sa.String()),
            nullable=False,
            server_default="{}",
        ),
    )

    # Applications: where they came from + explicit consent + answers.
    op.add_column(
        "applications",
        sa.Column("source", sa.String(20), nullable=False, server_default="platform"),
    )
    op.add_column(
        "applications",
        sa.Column("consented_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "applications",
        sa.Column("screening_answers", postgresql.JSONB(), nullable=True),
    )

    op.add_column("resumes", sa.Column("cv_file_key", sa.String(500), nullable=True))

    op.create_table(
        "magic_link_tokens",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_magic_link_tokens_email", "magic_link_tokens", ["email"])


def downgrade() -> None:
    op.drop_index("ix_magic_link_tokens_email", table_name="magic_link_tokens")
    op.drop_table("magic_link_tokens")
    op.drop_column("resumes", "cv_file_key")
    op.drop_column("applications", "screening_answers")
    op.drop_column("applications", "consented_at")
    op.drop_column("applications", "source")
    op.drop_column("jobs", "screening_questions")
    op.drop_constraint("uq_jobs_slug", "jobs", type_="unique")
    op.drop_column("jobs", "slug")
    op.drop_constraint("uq_companies_slug", "companies", type_="unique")
    op.drop_column("companies", "slug")

"""Company plans, job passes and monthly AI review usage.

Revision ID: 05b5ba8c8acd
Revises: 6042ec1eb6cf
Create Date: 2026-10-17
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "05b5ba8c8acd"
down_revision: str | None = "6042ec1eb6cf"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "companies",
        sa.Column("plan", sa.String(length=20), nullable=False, server_default="free"),
    )
    op.create_table(
        "company_monthly_usage",
        sa.Column(
            "company_id",
            sa.Uuid(),
            sa.ForeignKey("companies.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("month", sa.Date(), primary_key=True),
        sa.Column("reviews_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "extra_reviews_used", sa.Integer(), nullable=False, server_default="0"
        ),
    )
    op.create_table(
        "company_review_credits",
        sa.Column(
            "company_id",
            sa.Uuid(),
            sa.ForeignKey("companies.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("remaining", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_table(
        "job_passes",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "company_id",
            sa.Uuid(),
            sa.ForeignKey("companies.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "job_id",
            sa.Uuid(),
            sa.ForeignKey("jobs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("kind", sa.String(length=20), nullable=False),
        sa.Column("reviews_included", sa.Integer(), nullable=False),
        sa.Column("reviews_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("price_npr", sa.Integer(), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_job_passes_company_id", "job_passes", ["company_id"])
    op.create_index("ix_job_passes_job_expires", "job_passes", ["job_id", "expires_at"])


def downgrade() -> None:
    op.drop_index("ix_job_passes_job_expires", table_name="job_passes")
    op.drop_index("ix_job_passes_company_id", table_name="job_passes")
    op.drop_table("job_passes")
    op.drop_table("company_review_credits")
    op.drop_table("company_monthly_usage")
    op.drop_column("companies", "plan")

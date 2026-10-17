"""Assistant threads replace the recruiter chat and AI job draft tables.

Revision ID: 6042ec1eb6cf
Revises: b0acfd8bc7d7
Create Date: 2026-10-17
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "6042ec1eb6cf"
down_revision: str | None = "b0acfd8bc7d7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_NOW = sa.text("now()")


def _timestamps() -> list[sa.Column]:
    return [
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=_NOW,
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=_NOW,
            nullable=False,
        ),
    ]


def upgrade() -> None:
    op.create_table(
        "assistant_threads",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "company_id",
            sa.Uuid(),
            sa.ForeignKey("companies.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "recruiter_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("kind", sa.String(length=20), nullable=False),
        sa.Column(
            "application_id",
            sa.Uuid(),
            sa.ForeignKey("applications.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("draft", postgresql.JSONB(), nullable=True),
        sa.Column(
            "messages",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        *_timestamps(),
        sa.UniqueConstraint(
            "recruiter_id", "application_id", name="uq_assistant_thread_application"
        ),
    )
    for column in ("company_id", "recruiter_id", "application_id"):
        op.create_index(f"ix_assistant_threads_{column}", "assistant_threads", [column])

    op.drop_table("recruiter_chat_sessions")
    op.drop_table("job_ai_drafts")


def downgrade() -> None:
    # Old tables come back empty; their rows are not restored.
    op.create_table(
        "job_ai_drafts",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "recruiter_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "company_id",
            sa.Uuid(),
            sa.ForeignKey("companies.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("thread_id", sa.String(length=255), nullable=False, unique=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("mode", sa.String(length=50), nullable=False),
        sa.Column("source_title", sa.Text(), nullable=True),
        sa.Column("source_rough_description", sa.Text(), nullable=True),
        sa.Column("locked_fields", postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column("latest_draft", postgresql.JSONB(), nullable=True),
        sa.Column("salary_research", postgresql.JSONB(), nullable=True),
        sa.Column("assumptions", postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column("warnings", postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column("missing_fields", postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column("last_interrupt", postgresql.JSONB(), nullable=True),
        sa.Column(
            "committed_job_id",
            sa.Uuid(),
            sa.ForeignKey("jobs.id", ondelete="SET NULL"),
            nullable=True,
        ),
        *_timestamps(),
    )
    op.create_table(
        "recruiter_chat_sessions",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "recruiter_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "company_id",
            sa.Uuid(),
            sa.ForeignKey("companies.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("thread_id", sa.String(length=255), nullable=False, unique=True),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("last_interaction_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "state_json",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        *_timestamps(),
    )
    op.drop_table("assistant_threads")

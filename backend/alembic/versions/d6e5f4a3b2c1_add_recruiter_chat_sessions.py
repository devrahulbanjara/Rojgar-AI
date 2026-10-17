"""add recruiter chat sessions table

Revision ID: d6e5f4a3b2c1
Revises: c1a2b3c4d5e6
Create Date: 2026-03-21 12:05:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d6e5f4a3b2c1"
down_revision: str | Sequence[str] | None = "c1a2b3c4d5e6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Apply the recruiter chat sessions migration."""
    op.create_table(
        "recruiter_chat_sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("recruiter_id", sa.Uuid(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("thread_id", sa.String(length=255), nullable=False),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("last_interaction_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recruiter_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("thread_id"),
    )
    op.create_index(
        op.f("ix_recruiter_chat_sessions_company_id"),
        "recruiter_chat_sessions",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_recruiter_chat_sessions_recruiter_id"),
        "recruiter_chat_sessions",
        ["recruiter_id"],
        unique=False,
    )


def downgrade() -> None:
    """Revert the recruiter chat sessions migration."""
    op.drop_index(
        op.f("ix_recruiter_chat_sessions_recruiter_id"),
        table_name="recruiter_chat_sessions",
    )
    op.drop_index(
        op.f("ix_recruiter_chat_sessions_company_id"),
        table_name="recruiter_chat_sessions",
    )
    op.drop_table("recruiter_chat_sessions")

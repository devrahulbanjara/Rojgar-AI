"""add shortlisting and outreach tables

Revision ID: a1b2c3d4e5f6
Revises: f5a1d9c3b8aa
Create Date: 2026-03-19 10:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: str | Sequence[str] | None = "f5a1d9c3b8aa"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Apply the shortlisting and outreach schema migration."""
    op.add_column("applications", sa.Column("score", sa.Integer(), nullable=True))
    op.add_column("applications", sa.Column("feedback", sa.Text(), nullable=True))
    op.add_column(
        "applications",
        sa.Column(
            "shortlist_notified",
            sa.Boolean(),
            server_default="false",
            nullable=False,
        ),
    )
    op.create_index("ix_applications_score", "applications", ["score"], unique=False)

    op.execute(
        "CREATE TYPE shortliststatus AS ENUM "
        "('not_started', 'in_progress', 'completed', 'failed')"
    )
    op.add_column(
        "jobs",
        sa.Column(
            "shortlist_status",
            sa.Enum(
                "not_started",
                "in_progress",
                "completed",
                "failed",
                name="shortliststatus",
            ),
            server_default="not_started",
            nullable=False,
        ),
    )
    op.add_column(
        "jobs",
        sa.Column(
            "final_shortlist_completed",
            sa.Boolean(),
            server_default="false",
            nullable=False,
        ),
    )

    op.create_table(
        "email_drafts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("application_id", sa.Uuid(), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=True),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("is_approved", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("is_sent", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("is_discarded", sa.Boolean(), server_default="false", nullable=False),
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
        sa.ForeignKeyConstraint(
            ["application_id"], ["applications.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("application_id", name="uq_email_draft_application"),
    )
    op.create_index(
        "ix_email_drafts_application_id",
        "email_drafts",
        ["application_id"],
        unique=True,
    )


def downgrade() -> None:
    """Revert the shortlisting and outreach schema migration."""
    op.drop_index("ix_email_drafts_application_id", table_name="email_drafts")
    op.drop_table("email_drafts")
    op.drop_column("jobs", "final_shortlist_completed")
    op.drop_column("jobs", "shortlist_status")
    op.execute("DROP TYPE shortliststatus")
    op.drop_index("ix_applications_score", table_name="applications")
    op.drop_column("applications", "shortlist_notified")
    op.drop_column("applications", "feedback")
    op.drop_column("applications", "score")

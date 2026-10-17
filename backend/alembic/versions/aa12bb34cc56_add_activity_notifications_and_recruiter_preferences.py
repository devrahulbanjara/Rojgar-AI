"""add activity notifications and recruiter preferences

Revision ID: aa12bb34cc56
Revises: f5a1d9c3b8aa
Create Date: 2026-04-08 22:10:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "aa12bb34cc56"
down_revision: str | None = "f5a1d9c3b8aa"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Apply the activity, notifications, and recruiter-preferences migration."""
    op.create_table(
        "activity_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("company_id", sa.Uuid(), nullable=True),
        sa.Column("application_id", sa.Uuid(), nullable=True),
        sa.Column("job_id", sa.Uuid(), nullable=True),
        sa.Column("interview_id", sa.Uuid(), nullable=True),
        sa.Column("draft_id", sa.Uuid(), nullable=True),
        sa.Column("actor_user_id", sa.Uuid(), nullable=True),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("audience", sa.String(length=30), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("href", sa.String(length=500), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["application_id"], ["applications.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["draft_id"], ["email_drafts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["interview_id"], ["interviews.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_activity_events_actor_user_id"),
        "activity_events",
        ["actor_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_activity_events_application_id"),
        "activity_events",
        ["application_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_activity_events_audience"),
        "activity_events",
        ["audience"],
        unique=False,
    )
    op.create_index(
        op.f("ix_activity_events_company_id"),
        "activity_events",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_activity_events_created_at"),
        "activity_events",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        op.f("ix_activity_events_draft_id"),
        "activity_events",
        ["draft_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_activity_events_event_type"),
        "activity_events",
        ["event_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_activity_events_interview_id"),
        "activity_events",
        ["interview_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_activity_events_job_id"), "activity_events", ["job_id"], unique=False
    )
    op.create_index(
        op.f("ix_activity_events_user_id"), "activity_events", ["user_id"], unique=False
    )

    op.create_table(
        "notifications",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("company_id", sa.Uuid(), nullable=True),
        sa.Column("activity_event_id", sa.Uuid(), nullable=True),
        sa.Column("kind", sa.String(length=100), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("href", sa.String(length=500), nullable=True),
        sa.Column("is_read", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["activity_event_id"], ["activity_events.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_notifications_activity_event_id"),
        "notifications",
        ["activity_event_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_notifications_company_id"),
        "notifications",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_notifications_created_at"),
        "notifications",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        op.f("ix_notifications_is_read"), "notifications", ["is_read"], unique=False
    )
    op.create_index(
        op.f("ix_notifications_kind"), "notifications", ["kind"], unique=False
    )
    op.create_index(
        op.f("ix_notifications_user_id"), "notifications", ["user_id"], unique=False
    )

    op.create_table(
        "recruiter_preferences",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("timezone", sa.String(length=100), nullable=True),
        sa.Column(
            "notification_email_enabled",
            sa.Boolean(),
            server_default="true",
            nullable=False,
        ),
        sa.Column(
            "notification_in_app_enabled",
            sa.Boolean(),
            server_default="true",
            nullable=False,
        ),
        sa.Column(
            "default_interview_duration_minutes",
            sa.Integer(),
            server_default="45",
            nullable=False,
        ),
        sa.Column(
            "default_interview_buffer_minutes",
            sa.Integer(),
            server_default="15",
            nullable=False,
        ),
        sa.Column("outreach_signature", sa.Text(), nullable=True),
        sa.Column(
            "chat_default_scope",
            sa.String(length=30),
            server_default="company",
            nullable=False,
        ),
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
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(
        op.f("ix_recruiter_preferences_user_id"),
        "recruiter_preferences",
        ["user_id"],
        unique=True,
    )

    op.add_column(
        "email_drafts", sa.Column("generated_by_user_id", sa.Uuid(), nullable=True)
    )
    op.add_column(
        "email_drafts", sa.Column("approved_by_user_id", sa.Uuid(), nullable=True)
    )
    op.add_column(
        "email_drafts",
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "email_drafts", sa.Column("sent_by_user_id", sa.Uuid(), nullable=True)
    )
    op.add_column(
        "email_drafts", sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "email_drafts", sa.Column("discarded_by_user_id", sa.Uuid(), nullable=True)
    )
    op.add_column(
        "email_drafts",
        sa.Column("discarded_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_email_drafts_generated_by_user",
        "email_drafts",
        "users",
        ["generated_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_email_drafts_approved_by_user",
        "email_drafts",
        "users",
        ["approved_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_email_drafts_sent_by_user",
        "email_drafts",
        "users",
        ["sent_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_email_drafts_discarded_by_user",
        "email_drafts",
        "users",
        ["discarded_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    """Revert the activity, notifications, and recruiter-preferences migration."""
    op.drop_constraint(
        "fk_email_drafts_discarded_by_user", "email_drafts", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_email_drafts_sent_by_user", "email_drafts", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_email_drafts_approved_by_user", "email_drafts", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_email_drafts_generated_by_user", "email_drafts", type_="foreignkey"
    )
    op.drop_column("email_drafts", "discarded_at")
    op.drop_column("email_drafts", "discarded_by_user_id")
    op.drop_column("email_drafts", "sent_at")
    op.drop_column("email_drafts", "sent_by_user_id")
    op.drop_column("email_drafts", "approved_at")
    op.drop_column("email_drafts", "approved_by_user_id")
    op.drop_column("email_drafts", "generated_by_user_id")

    op.drop_index(
        op.f("ix_recruiter_preferences_user_id"), table_name="recruiter_preferences"
    )
    op.drop_table("recruiter_preferences")

    op.drop_index(op.f("ix_notifications_user_id"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_kind"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_is_read"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_created_at"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_company_id"), table_name="notifications")
    op.drop_index(
        op.f("ix_notifications_activity_event_id"), table_name="notifications"
    )
    op.drop_table("notifications")

    op.drop_index(op.f("ix_activity_events_user_id"), table_name="activity_events")
    op.drop_index(op.f("ix_activity_events_job_id"), table_name="activity_events")
    op.drop_index(op.f("ix_activity_events_interview_id"), table_name="activity_events")
    op.drop_index(op.f("ix_activity_events_event_type"), table_name="activity_events")
    op.drop_index(op.f("ix_activity_events_draft_id"), table_name="activity_events")
    op.drop_index(op.f("ix_activity_events_created_at"), table_name="activity_events")
    op.drop_index(op.f("ix_activity_events_company_id"), table_name="activity_events")
    op.drop_index(op.f("ix_activity_events_audience"), table_name="activity_events")
    op.drop_index(
        op.f("ix_activity_events_application_id"), table_name="activity_events"
    )
    op.drop_index(
        op.f("ix_activity_events_actor_user_id"), table_name="activity_events"
    )
    op.drop_table("activity_events")

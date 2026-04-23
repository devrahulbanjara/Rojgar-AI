"""add audit logs table

Revision ID: b1c2d3e4f5a6
Revises: f8e7d6c5b4a3
Create Date: 2026-04-08 18:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, None] = "f8e7d6c5b4a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Apply the audit-logs table migration."""
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("actor_user_id", sa.Uuid(), nullable=True),
        sa.Column("actor_role", sa.String(length=50), nullable=True),
        sa.Column("target_user_id", sa.Uuid(), nullable=True),
        sa.Column("company_id", sa.Uuid(), nullable=True),
        sa.Column("entity_type", sa.String(length=80), nullable=False),
        sa.Column("entity_id", sa.String(length=255), nullable=True),
        sa.Column("parent_entity_type", sa.String(length=80), nullable=True),
        sa.Column("parent_entity_id", sa.String(length=255), nullable=True),
        sa.Column("action_type", sa.String(length=50), nullable=False),
        sa.Column("request_id", sa.String(length=100), nullable=True),
        sa.Column("request_path", sa.String(length=500), nullable=True),
        sa.Column("request_method", sa.String(length=20), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column(
            "source",
            sa.String(length=30),
            server_default="system",
            nullable=False,
        ),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("success", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "before_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
        sa.Column("after_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("diff_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_audit_logs_actor_user_id"),
        "audit_logs",
        ["actor_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_audit_logs_target_user_id"),
        "audit_logs",
        ["target_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_audit_logs_company_id"), "audit_logs", ["company_id"], unique=False
    )
    op.create_index(
        op.f("ix_audit_logs_entity_type"), "audit_logs", ["entity_type"], unique=False
    )
    op.create_index(
        op.f("ix_audit_logs_action_type"), "audit_logs", ["action_type"], unique=False
    )
    op.create_index(
        op.f("ix_audit_logs_request_id"), "audit_logs", ["request_id"], unique=False
    )
    op.create_index(
        op.f("ix_audit_logs_success"), "audit_logs", ["success"], unique=False
    )
    op.create_index(
        op.f("ix_audit_logs_created_at"), "audit_logs", ["created_at"], unique=False
    )
    op.create_index(
        "ix_audit_logs_entity_lookup",
        "audit_logs",
        ["entity_type", "entity_id"],
        unique=False,
    )
    op.create_index(
        "ix_audit_logs_company_created_at",
        "audit_logs",
        ["company_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    """Revert the audit-logs table migration."""
    op.drop_index("ix_audit_logs_company_created_at", table_name="audit_logs")
    op.drop_index("ix_audit_logs_entity_lookup", table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_created_at"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_success"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_request_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_action_type"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_entity_type"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_company_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_target_user_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_actor_user_id"), table_name="audit_logs")
    op.drop_table("audit_logs")

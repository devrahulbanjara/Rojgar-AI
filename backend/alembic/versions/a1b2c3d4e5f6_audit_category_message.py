"""add category and message columns to audit_logs

Revision ID: a1b2c3d4e5f6
Revises: h1i2j3k4l5m6
Create Date: 2026-04-30
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "a1b2c3d4e5f6"
down_revision = "h1i2j3k4l5m6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("audit_logs", sa.Column("category", sa.String(30), nullable=True))
    op.add_column("audit_logs", sa.Column("message", sa.Text(), nullable=True))
    op.create_index("ix_audit_logs_category", "audit_logs", ["category"])


def downgrade() -> None:
    op.drop_index("ix_audit_logs_category", table_name="audit_logs")
    op.drop_column("audit_logs", "message")
    op.drop_column("audit_logs", "category")

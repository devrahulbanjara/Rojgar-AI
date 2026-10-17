"""Suggest someone you know: job_suggestions.

Revision ID: e1267236faf8
Revises: b0acfd8bc7d7
Create Date: 2026-10-17
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e1267236faf8"
down_revision: Union[str, None] = "b0acfd8bc7d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "job_suggestions",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "job_id",
            sa.Uuid(),
            sa.ForeignKey("jobs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("referrer_name", sa.String(255), nullable=False),
        sa.Column("referrer_phone", sa.String(20)),
        sa.Column("referrer_ref", sa.String(64)),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("note", sa.String(500)),
        sa.Column("token", sa.String(32), nullable=False, unique=True),
        sa.Column(
            "application_id",
            sa.Uuid(),
            sa.ForeignKey("applications.id", ondelete="SET NULL"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("job_id", "phone", name="uq_job_suggestion_phone"),
    )
    op.create_index("ix_job_suggestions_job_id", "job_suggestions", ["job_id"])


def downgrade() -> None:
    op.drop_index("ix_job_suggestions_job_id", table_name="job_suggestions")
    op.drop_table("job_suggestions")

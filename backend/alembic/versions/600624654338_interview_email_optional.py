"""Interviews for phone-only applicants: candidate_email may be empty.

Revision ID: 600624654338
Revises: e1267236faf8
Create Date: 2026-10-17
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "600624654338"
down_revision: str | None = "e1267236faf8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "interviews", "candidate_email", existing_type=sa.String(255), nullable=True
    )


def downgrade() -> None:
    op.execute(
        "UPDATE interviews SET candidate_email = '' WHERE candidate_email IS NULL"
    )
    op.alter_column(
        "interviews", "candidate_email", existing_type=sa.String(255), nullable=False
    )

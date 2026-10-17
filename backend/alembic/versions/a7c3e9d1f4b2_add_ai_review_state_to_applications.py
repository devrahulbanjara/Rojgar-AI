"""add AI review state to applications

Tracks per-application AI review outcome so failed or flagged reviews are
routed to a recruiter instead of being retried forever or silently faked.

Revision ID: a7c3e9d1f4b2
Revises: r1s2t3u4v5w6
Create Date: 2026-10-17 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a7c3e9d1f4b2"
down_revision: Union[str, None] = "r1s2t3u4v5w6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "applications", sa.Column("ai_review_status", sa.Text(), nullable=True)
    )
    op.add_column(
        "applications",
        sa.Column(
            "ai_review_attempts", sa.Integer(), server_default="0", nullable=False
        ),
    )
    op.add_column("applications", sa.Column("ai_flag_reason", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("applications", "ai_flag_reason")
    op.drop_column("applications", "ai_review_attempts")
    op.drop_column("applications", "ai_review_status")

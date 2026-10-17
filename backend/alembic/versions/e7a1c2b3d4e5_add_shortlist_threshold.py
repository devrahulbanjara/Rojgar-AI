"""add shortlist threshold to jobs

Revision ID: e7a1c2b3d4e5
Revises: d6e5f4a3b2c1
Create Date: 2026-03-28 17:45:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "e7a1c2b3d4e5"
down_revision: str | Sequence[str] | None = "d6e5f4a3b2c1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Apply the shortlist-threshold migration."""
    op.add_column(
        "jobs",
        sa.Column(
            "shortlist_threshold", sa.Integer(), server_default="70", nullable=False
        ),
    )


def downgrade() -> None:
    """Revert the shortlist-threshold migration."""
    op.drop_column("jobs", "shortlist_threshold")

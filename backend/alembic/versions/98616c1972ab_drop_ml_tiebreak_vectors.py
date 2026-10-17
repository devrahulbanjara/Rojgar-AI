"""Drop the ML tie-break's vectors: the review sorts by its checks alone.

Revision ID: 98616c1972ab
Revises: b0a2686f2756
Create Date: 2026-10-17
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "98616c1972ab"
down_revision: str | None = "b0a2686f2756"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_column("jobs", "jd_embedding")
    op.drop_column("applications", "resume_embedding")


def downgrade() -> None:
    op.add_column(
        "applications",
        sa.Column("resume_embedding", sa.ARRAY(sa.Float()), nullable=True),
    )
    op.add_column(
        "jobs", sa.Column("jd_embedding", sa.ARRAY(sa.Float()), nullable=True)
    )

"""add expires_at to jobs

Revision ID: e4f8b2c91a47
Revises: d23940f60d36
Create Date: 2026-03-14 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e4f8b2c91a47"
down_revision: str | Sequence[str] | None = "d23940f60d36"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "jobs",
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(op.f("ix_jobs_expires_at"), "jobs", ["expires_at"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_jobs_expires_at"), table_name="jobs")
    op.drop_column("jobs", "expires_at")

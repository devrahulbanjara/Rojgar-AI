"""add_threshold_to_job_posting

Revision ID: 2c4091682b57
Revises: eea1c6949a74
Create Date: 2026-02-18 00:18:52.829034

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "2c4091682b57"
down_revision: str | Sequence[str] | None = "eea1c6949a74"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "job_posting",
        sa.Column(
            "shortlist_threshold", sa.Integer(), nullable=False, server_default="70"
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("job_posting", "shortlist_threshold")

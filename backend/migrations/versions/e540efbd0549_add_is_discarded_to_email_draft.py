"""add_is_discarded_to_email_draft

Revision ID: e540efbd0549
Revises: 4aa887cd24a6
Create Date: 2026-02-21 20:24:42.347861

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e540efbd0549"
down_revision: str | Sequence[str] | None = "4aa887cd24a6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add column as nullable first
    op.add_column("email_draft", sa.Column("is_discarded", sa.Boolean(), nullable=True))

    # Set default value for existing rows
    op.execute("UPDATE email_draft SET is_discarded = FALSE WHERE is_discarded IS NULL")

    # Make column non-nullable
    op.alter_column("email_draft", "is_discarded", nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("email_draft", "is_discarded")

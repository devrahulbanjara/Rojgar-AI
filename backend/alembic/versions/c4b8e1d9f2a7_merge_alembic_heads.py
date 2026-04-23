"""merge alembic heads

Revision ID: c4b8e1d9f2a7
Revises: aa12bb34cc56, b1c2d3e4f5a6, a9c4e7f2b6d1
Create Date: 2026-04-17 16:12:00.000000
"""

from collections.abc import Sequence


# revision identifiers, used by Alembic.
revision: str = "c4b8e1d9f2a7"
down_revision: Sequence[str] | None = (
    "aa12bb34cc56",
    "b1c2d3e4f5a6",
    "a9c4e7f2b6d1",
)
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Merge Alembic heads without schema changes."""
    pass


def downgrade() -> None:
    """Undo the Alembic heads merge marker."""
    pass

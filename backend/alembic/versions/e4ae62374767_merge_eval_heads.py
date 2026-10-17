"""merge eval heads

Revision ID: e4ae62374767
Revises: e2f3a4b5c6d7, h1i2j3k4l5m6
Create Date: 2026-05-01 15:16:51.111877

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "e4ae62374767"
down_revision: str | Sequence[str] | None = ("e2f3a4b5c6d7", "h1i2j3k4l5m6")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""


def downgrade() -> None:
    """Downgrade schema."""

"""offer response statuses and account soft-delete

Revision ID: h1i2j3k4l5m6
Revises: b1c2d3e4f5a6, a9c4e7f2b6d1, aa12bb34cc56
Create Date: 2026-04-20 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "h1i2j3k4l5m6"
down_revision: Union[str, Sequence[str], None] = (
    "b1c2d3e4f5a6",
    "a9c4e7f2b6d1",
    "aa12bb34cc56",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Extend applicationstatus enum with offer response values.
    # ADD VALUE IF NOT EXISTS is safe to run multiple times.
    op.execute("ALTER TYPE applicationstatus ADD VALUE IF NOT EXISTS 'offer_accepted'")
    op.execute("ALTER TYPE applicationstatus ADD VALUE IF NOT EXISTS 'offer_declined'")

    # Add soft-delete columns to users table.
    op.add_column(
        "users",
        sa.Column(
            "is_deleted",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "deleted_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )
    op.create_index("ix_users_is_deleted", "users", ["is_deleted"])


def downgrade() -> None:
    # PostgreSQL cannot remove enum values; downgrade only removes the user columns.
    op.drop_index("ix_users_is_deleted", table_name="users")
    op.drop_column("users", "deleted_at")
    op.drop_column("users", "is_deleted")

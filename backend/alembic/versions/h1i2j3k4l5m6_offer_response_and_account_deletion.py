"""offer response statuses and account soft-delete

Revision ID: h1i2j3k4l5m6
Revises: b1c2d3e4f5a6, a9c4e7f2b6d1, aa12bb34cc56
Create Date: 2026-04-20 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "h1i2j3k4l5m6"
down_revision: str | Sequence[str] | None = (
    "b1c2d3e4f5a6",
    "a9c4e7f2b6d1",
    "aa12bb34cc56",
)
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Apply the offer-response and account-deletion migration."""
    conn = op.get_bind()

    # Extend applicationstatus enum with offer response values.
    # ADD VALUE IF NOT EXISTS is safe to run multiple times.
    op.execute("ALTER TYPE applicationstatus ADD VALUE IF NOT EXISTS 'offer_accepted'")
    op.execute("ALTER TYPE applicationstatus ADD VALUE IF NOT EXISTS 'offer_declined'")

    # Add is_deleted column if it doesn't exist yet.
    # NOTE: filter by table_schema='public' — Supabase also has auth.users which
    # has its own columns that would cause the schema-unfiltered check to give
    # a false positive and silently skip adding the column to public.users.
    result = conn.execute(
        sa.text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name='users' AND column_name='is_deleted'"
        )
    )
    if result.fetchone() is None:
        op.add_column(
            "users",
            sa.Column(
                "is_deleted",
                sa.Boolean(),
                nullable=False,
                server_default="false",
            ),
        )

    # Add deleted_at column if it doesn't exist yet.
    result = conn.execute(
        sa.text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name='users' AND column_name='deleted_at'"
        )
    )
    if result.fetchone() is None:
        op.add_column(
            "users",
            sa.Column(
                "deleted_at",
                sa.DateTime(timezone=True),
                nullable=True,
            ),
        )

    # Create index only if it doesn't exist.
    result = conn.execute(
        sa.text(
            "SELECT 1 FROM pg_indexes "
            "WHERE tablename='users' AND indexname='ix_users_is_deleted'"
        )
    )
    if result.fetchone() is None:
        op.create_index("ix_users_is_deleted", "users", ["is_deleted"])


def downgrade() -> None:
    """Revert the offer-response and account-deletion migration."""
    # PostgreSQL cannot remove enum values; downgrade only removes the user columns.
    op.drop_index("ix_users_is_deleted", table_name="users")
    op.drop_column("users", "deleted_at")
    op.drop_column("users", "is_deleted")

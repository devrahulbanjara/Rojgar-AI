"""add application sync events outbox table

Revision ID: c1a2b3c4d5e6
Revises: b2c3d4e5f6g7
Create Date: 2026-03-21 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "c1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e5f6g7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Apply the application sync-events migration."""
    syncaction = postgresql.ENUM(
        "UPSERT",
        "DELETE",
        name="syncaction",
        create_type=False,
    )
    syncstatus = postgresql.ENUM(
        "PENDING",
        "COMPLETED",
        "FAILED",
        name="syncstatus",
        create_type=False,
    )

    op.create_table(
        "application_sync_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("application_id", sa.Uuid(), nullable=False),
        sa.Column("action", syncaction, nullable=False),
        sa.Column("status", syncstatus, server_default="PENDING", nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_application_sync_events_application_id"),
        "application_sync_events",
        ["application_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_application_sync_events_status"),
        "application_sync_events",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    """Revert the application sync-events migration."""
    op.drop_index(
        op.f("ix_application_sync_events_status"),
        table_name="application_sync_events",
    )
    op.drop_index(
        op.f("ix_application_sync_events_application_id"),
        table_name="application_sync_events",
    )
    op.drop_table("application_sync_events")

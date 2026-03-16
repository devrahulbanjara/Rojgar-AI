"""add resume import tasks table

Revision ID: f5a1d9c3b8aa
Revises: e4f8b2c91a47
Create Date: 2026-03-16 14:45:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "f5a1d9c3b8aa"
down_revision: Union[str, Sequence[str], None] = "e4f8b2c91a47"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "resume_import_tasks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("source_file_name", sa.String(length=255), nullable=True),
        sa.Column(
            "result_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
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
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_resume_import_tasks_user_id"),
        "resume_import_tasks",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f("ix_resume_import_tasks_user_id"), table_name="resume_import_tasks"
    )
    op.drop_table("resume_import_tasks")

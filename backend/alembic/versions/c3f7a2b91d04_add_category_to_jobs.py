"""add category to jobs

Revision ID: c3f7a2b91d04
Revises: bdac37ff1b0b
Create Date: 2026-03-06 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "c3f7a2b91d04"
down_revision: Union[str, Sequence[str], None] = "bdac37ff1b0b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Apply the job category migration."""
    op.add_column("jobs", sa.Column("category", sa.String(length=50), nullable=True))
    op.create_index(op.f("ix_jobs_category"), "jobs", ["category"], unique=False)


def downgrade() -> None:
    """Revert the job category migration."""
    op.drop_index(op.f("ix_jobs_category"), table_name="jobs")
    op.drop_column("jobs", "category")

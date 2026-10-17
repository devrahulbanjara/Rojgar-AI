"""add hired_at to jobs

Revision ID: p1q2r3s4t5u6
Revises: o1p2q3r4s5t6
Create Date: 2026-05-02 10:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "p1q2r3s4t5u6"
down_revision: str | Sequence[str] | None = "o1p2q3r4s5t6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "jobs",
        sa.Column("hired_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(op.f("ix_jobs_hired_at"), "jobs", ["hired_at"], unique=False)
    op.execute(
        "UPDATE jobs SET hired_at = updated_at WHERE hiring_completed = true AND hired_at IS NULL"
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_jobs_hired_at"), table_name="jobs")
    op.drop_column("jobs", "hired_at")

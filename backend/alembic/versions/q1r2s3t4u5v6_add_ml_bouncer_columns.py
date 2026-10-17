"""add ml bouncer columns for two-stage screening pipeline

Revision ID: q1r2s3t4u5v6
Revises: p1q2r3s4t5u6
Create Date: 2026-05-03 10:00:00.000000

Adds required_years_of_experience and jd_embedding to jobs, and
resume_embedding and ml_bouncer_score to applications, enabling
the Resource-Aware Multi-Stage Screening Pipeline.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "q1r2s3t4u5v6"
down_revision: str | None = "p1q2r3s4t5u6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "jobs",
        sa.Column("required_years_of_experience", sa.Integer(), nullable=True),
    )
    op.add_column(
        "jobs",
        sa.Column("jd_embedding", sa.ARRAY(sa.Float()), nullable=True),
    )
    op.add_column(
        "applications",
        sa.Column("resume_embedding", sa.ARRAY(sa.Float()), nullable=True),
    )
    op.add_column(
        "applications",
        sa.Column("ml_bouncer_score", sa.Float(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("applications", "ml_bouncer_score")
    op.drop_column("applications", "resume_embedding")
    op.drop_column("jobs", "jd_embedding")
    op.drop_column("jobs", "required_years_of_experience")

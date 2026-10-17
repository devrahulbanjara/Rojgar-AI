"""Replace feedback with strengths and weaknesses

Revision ID: m1n2o3p4q5r6
Revises: k1l2m3n4o5p6
Create Date: 2026-05-02 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from alembic import op

revision: str = "m1n2o3p4q5r6"
down_revision: str | None = "k1l2m3n4o5p6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("applications", sa.Column("strengths", JSONB(), nullable=True))
    op.add_column("applications", sa.Column("weaknesses", JSONB(), nullable=True))

    op.execute(
        "UPDATE applications SET strengths = jsonb_build_array(feedback) "
        "WHERE feedback IS NOT NULL"
    )

    op.drop_column("applications", "feedback")


def downgrade() -> None:
    op.add_column(
        "applications",
        sa.Column("feedback", sa.Text(), nullable=True),
    )

    op.execute(
        "UPDATE applications SET feedback = strengths->>0 "
        "WHERE strengths IS NOT NULL AND jsonb_array_length(strengths) > 0"
    )

    op.drop_column("applications", "weaknesses")
    op.drop_column("applications", "strengths")

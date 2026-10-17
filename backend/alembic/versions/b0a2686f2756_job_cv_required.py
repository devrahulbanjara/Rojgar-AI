"""Jobs say whether applying needs a CV; existing jobs follow their category.

Revision ID: b0a2686f2756
Revises: 4fcc41f66b22
Create Date: 2026-10-17
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "b0a2686f2756"
down_revision: str | None = "4fcc41f66b22"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Mirrors app.shared.enums.CV_REQUIRED_CATEGORIES at the time of writing.
_CV_REQUIRED = (
    "banking_finance",
    "healthcare",
    "education",
    "it_software",
    "ngo_ingo",
    "government_public",
    "office_admin",
)


def upgrade() -> None:
    op.add_column(
        "jobs",
        sa.Column(
            "cv_required", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
    )
    op.execute(
        sa.text(
            "UPDATE jobs SET cv_required = true WHERE category::text = ANY(:cats)"
        ).bindparams(sa.bindparam("cats", list(_CV_REQUIRED)))
    )


def downgrade() -> None:
    op.drop_column("jobs", "cv_required")

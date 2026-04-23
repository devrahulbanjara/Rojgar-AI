"""add company cal settings

Revision ID: a4d9e8c7b6f5
Revises: f9b3c7d1e2a4
Create Date: 2026-03-29 22:10:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a4d9e8c7b6f5"
down_revision: Union[str, Sequence[str], None] = "f9b3c7d1e2a4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Apply the company Cal settings schema migration."""
    op.add_column(
        "companies",
        sa.Column("cal_booking_url", sa.String(length=500), nullable=True),
    )
    op.add_column(
        "companies",
        sa.Column("cal_organizer_email", sa.String(length=255), nullable=True),
    )
    op.create_unique_constraint(
        "uq_companies_cal_organizer_email",
        "companies",
        ["cal_organizer_email"],
    )


def downgrade() -> None:
    """Revert the company Cal settings schema migration."""
    op.drop_constraint(
        "uq_companies_cal_organizer_email",
        "companies",
        type_="unique",
    )
    op.drop_column("companies", "cal_organizer_email")
    op.drop_column("companies", "cal_booking_url")

"""standardise application status enum

Revision ID: f9b3c7d1e2a4
Revises: 5c1b71f8d57e
Create Date: 2026-03-29 10:15:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "f9b3c7d1e2a4"
down_revision: str | Sequence[str] | None = "5c1b71f8d57e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Apply the application-status standardization migration."""
    op.execute("ALTER TYPE applicationstatus RENAME TO applicationstatus_old")

    op.execute(
        """
        CREATE TYPE applicationstatus AS ENUM (
            'applied',
            'screening',
            'shortlisted',
            'rejected',
            'interview_booked',
            'interview_completed',
            'offer'
        )
        """
    )

    op.execute("ALTER TABLE applications ALTER COLUMN status DROP DEFAULT")

    op.execute(
        """
        ALTER TABLE applications
        ALTER COLUMN status TYPE applicationstatus
        USING CASE status::text
            WHEN 'submitted' THEN 'applied'::applicationstatus
            WHEN 'screening' THEN 'screening'::applicationstatus
            WHEN 'interview_booked' THEN 'interview_booked'::applicationstatus
            WHEN 'interview' THEN 'interview_completed'::applicationstatus
            WHEN 'offered' THEN 'offer'::applicationstatus
            WHEN 'hired' THEN 'offer'::applicationstatus
            WHEN 'rejected' THEN 'rejected'::applicationstatus
            WHEN 'withdrawn' THEN 'rejected'::applicationstatus
            ELSE 'applied'::applicationstatus
        END
        """
    )

    op.execute(
        "ALTER TABLE applications ALTER COLUMN status SET DEFAULT 'applied'::applicationstatus"
    )
    op.execute("DROP TYPE applicationstatus_old")


def downgrade() -> None:
    """Revert the application-status standardization migration."""
    op.execute("ALTER TYPE applicationstatus RENAME TO applicationstatus_new")

    op.execute(
        """
        CREATE TYPE applicationstatus AS ENUM (
            'submitted',
            'screening',
            'interview_booked',
            'interview',
            'offered',
            'hired',
            'rejected',
            'withdrawn'
        )
        """
    )

    op.execute("ALTER TABLE applications ALTER COLUMN status DROP DEFAULT")

    op.execute(
        """
        ALTER TABLE applications
        ALTER COLUMN status TYPE applicationstatus
        USING CASE status::text
            WHEN 'applied' THEN 'submitted'::applicationstatus
            WHEN 'screening' THEN 'screening'::applicationstatus
            WHEN 'shortlisted' THEN 'screening'::applicationstatus
            WHEN 'interview_booked' THEN 'interview_booked'::applicationstatus
            WHEN 'interview_completed' THEN 'interview'::applicationstatus
            WHEN 'offer' THEN 'offered'::applicationstatus
            WHEN 'rejected' THEN 'rejected'::applicationstatus
            ELSE 'submitted'::applicationstatus
        END
        """
    )

    op.execute(
        "ALTER TABLE applications ALTER COLUMN status SET DEFAULT 'submitted'::applicationstatus"
    )
    op.execute("DROP TYPE applicationstatus_new")

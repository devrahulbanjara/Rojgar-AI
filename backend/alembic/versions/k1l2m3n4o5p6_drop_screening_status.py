"""drop screening from application status enum

Revision ID: k1l2m3n4o5p6
Revises: f1a2b3c4d5e6
Create Date: 2026-05-02 12:00:00.000000

Removes the transient `screening` value from `applicationstatus`. AI scoring no
longer transitions status — it only writes `score` and `feedback` while the
application stays at `applied` until finalize moves it to `shortlisted` or
`rejected`.

Existing `screening` rows are merged into `applied` because score+feedback
already capture the AI signal that `screening` was meant to represent.

WARNING: downgrade is irreversible for screening rows — they have already been
collapsed into `applied` on upgrade and the original distinction is lost.
"""

from typing import Sequence, Union

from alembic import op


revision: str = "k1l2m3n4o5p6"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Apply the screening-status removal."""
    op.execute(
        "UPDATE applications SET status = 'applied'::applicationstatus "
        "WHERE status = 'screening'::applicationstatus"
    )

    op.execute("ALTER TYPE applicationstatus RENAME TO applicationstatus_old")

    op.execute(
        """
        CREATE TYPE applicationstatus AS ENUM (
            'applied',
            'shortlisted',
            'rejected',
            'interview_booked',
            'interview_completed',
            'offer',
            'offer_accepted',
            'offer_declined'
        )
        """
    )

    op.execute("ALTER TABLE applications ALTER COLUMN status DROP DEFAULT")

    op.execute(
        """
        ALTER TABLE applications
        ALTER COLUMN status TYPE applicationstatus
        USING status::text::applicationstatus
        """
    )

    op.execute(
        "ALTER TABLE applications ALTER COLUMN status "
        "SET DEFAULT 'applied'::applicationstatus"
    )

    op.execute("DROP TYPE applicationstatus_old")


def downgrade() -> None:
    """Re-add the screening enum value (rows previously screening stay applied)."""
    op.execute("ALTER TYPE applicationstatus RENAME TO applicationstatus_new")

    op.execute(
        """
        CREATE TYPE applicationstatus AS ENUM (
            'applied',
            'screening',
            'shortlisted',
            'rejected',
            'interview_booked',
            'interview_completed',
            'offer',
            'offer_accepted',
            'offer_declined'
        )
        """
    )

    op.execute("ALTER TABLE applications ALTER COLUMN status DROP DEFAULT")

    op.execute(
        """
        ALTER TABLE applications
        ALTER COLUMN status TYPE applicationstatus
        USING status::text::applicationstatus
        """
    )

    op.execute(
        "ALTER TABLE applications ALTER COLUMN status "
        "SET DEFAULT 'applied'::applicationstatus"
    )

    op.execute("DROP TYPE applicationstatus_new")

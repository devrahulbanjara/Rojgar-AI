"""add interview_recordings table

Revision ID: f8e7d6c5b4a3
Revises: f9b3c7d1e2a4
Create Date: 2026-04-01 09:00:00.000000

"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "f8e7d6c5b4a3"
down_revision = "e1f2a3b4c5d6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Apply the interview recordings migration."""
    op.execute("DROP TABLE IF EXISTS interview_recordings CASCADE")
    op.execute("DROP TYPE IF EXISTS recordingstatus CASCADE")

    op.create_table(
        "interview_recordings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "application_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("applications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("s3_audio_url", sa.Text, nullable=False),
        sa.Column("s3_audio_key", sa.Text, nullable=False),
        sa.Column("transcript", sa.Text, nullable=True),
        sa.Column("evaluation", sa.Text, nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "uploaded",
                "transcribing",
                "transcribed",
                "evaluating",
                "evaluated",
                "failed",
                name="recordingstatus",
            ),
            nullable=False,
            server_default="uploaded",
        ),
        sa.Column("duration_seconds", sa.Integer, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_interview_recordings_application_id",
        "interview_recordings",
        ["application_id"],
    )


def downgrade() -> None:
    """Revert the interview recordings migration."""
    op.drop_index("ix_interview_recordings_application_id", "interview_recordings")
    op.drop_table("interview_recordings")
    op.execute("DROP TYPE recordingstatus")

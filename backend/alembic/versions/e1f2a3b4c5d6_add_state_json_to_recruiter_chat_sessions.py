"""add state_json to recruiter_chat_sessions

Revision ID: e1f2a3b4c5d6
Revises: c8d9e0f1a2b3
Create Date: 2026-03-29
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "e1f2a3b4c5d6"
down_revision = "c8d9e0f1a2b3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Apply the recruiter chat session state-json migration."""
    op.add_column(
        "recruiter_chat_sessions",
        sa.Column(
            "state_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )


def downgrade() -> None:
    """Revert the recruiter chat session state-json migration."""
    op.drop_column("recruiter_chat_sessions", "state_json")

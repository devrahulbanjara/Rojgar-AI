"""Drop source_text from job_ai_drafts

Revision ID: o1p2q3r4s5t6
Revises: n1o2p3q4r5s6
Create Date: 2026-05-02 15:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "o1p2q3r4s5t6"
down_revision: Union[str, None] = "n1o2p3q4r5s6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("job_ai_drafts", "source_text")


def downgrade() -> None:
    op.add_column(
        "job_ai_drafts",
        sa.Column("source_text", sa.Text(), nullable=True),
    )

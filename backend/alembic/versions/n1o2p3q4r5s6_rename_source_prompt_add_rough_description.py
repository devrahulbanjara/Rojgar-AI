"""Rename source_prompt to source_title, add source_rough_description, drop source_text on job_ai_drafts

Revision ID: n1o2p3q4r5s6
Revises: m1n2o3p4q5r6
Create Date: 2026-05-02 14:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "n1o2p3q4r5s6"
down_revision: Union[str, None] = "m1n2o3p4q5r6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("job_ai_drafts", "source_prompt", new_column_name="source_title")
    op.add_column(
        "job_ai_drafts",
        sa.Column("source_rough_description", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("job_ai_drafts", "source_rough_description")
    op.alter_column("job_ai_drafts", "source_title", new_column_name="source_prompt")

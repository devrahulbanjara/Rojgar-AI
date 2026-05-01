"""free-form evaluator rows: add evaluator_label, drop per-user uniqueness

Revision ID: f1a2b3c4d5e6
Revises: e4ae62374767
Create Date: 2026-05-01 16:00:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "f1a2b3c4d5e6"
down_revision = "e4ae62374767"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "candidate_evaluation_scores",
        sa.Column("evaluator_label", sa.String(length=200), nullable=True),
    )
    op.drop_constraint(
        "uq_eval_app_user_type",
        "candidate_evaluation_scores",
        type_="unique",
    )


def downgrade() -> None:
    op.create_unique_constraint(
        "uq_eval_app_user_type",
        "candidate_evaluation_scores",
        ["application_id", "evaluator_type", "submitted_by_user_id"],
    )
    op.drop_column("candidate_evaluation_scores", "evaluator_label")

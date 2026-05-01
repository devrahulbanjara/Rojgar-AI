"""multi-human evaluation scores

Revision ID: e2f3a4b5c6d7
Revises: d9e0f1a2b3c4
Create Date: 2026-05-01 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa

revision = "e2f3a4b5c6d7"
down_revision = "d9e0f1a2b3c4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Allow many human evaluation rows per application (one per recruiter)."""
    op.drop_constraint(
        "uq_candidate_evaluation_application_evaluator",
        "candidate_evaluation_scores",
        type_="unique",
    )
    op.create_index(
        "ix_eval_app_evaluator",
        "candidate_evaluation_scores",
        ["application_id", "evaluator_type"],
    )
    op.create_unique_constraint(
        "uq_eval_app_user_type",
        "candidate_evaluation_scores",
        ["application_id", "evaluator_type", "submitted_by_user_id"],
    )
    op.create_index(
        "uq_llm_per_app",
        "candidate_evaluation_scores",
        ["application_id"],
        unique=True,
        postgresql_where=sa.text("evaluator_type = 'llm'"),
    )


def downgrade() -> None:
    """Revert to a single human + single LLM row per application."""
    op.drop_index("uq_llm_per_app", table_name="candidate_evaluation_scores")
    op.drop_constraint(
        "uq_eval_app_user_type",
        "candidate_evaluation_scores",
        type_="unique",
    )
    op.drop_index("ix_eval_app_evaluator", table_name="candidate_evaluation_scores")
    op.create_unique_constraint(
        "uq_candidate_evaluation_application_evaluator",
        "candidate_evaluation_scores",
        ["application_id", "evaluator_type"],
    )

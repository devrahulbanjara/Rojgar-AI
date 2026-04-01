"""add job evaluation schema and candidate evaluation scores

Revision ID: a9c4e7f2b6d1
Revises: f8e7d6c5b4a3
Create Date: 2026-04-01 23:25:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "a9c4e7f2b6d1"
down_revision = "f8e7d6c5b4a3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "job_evaluation_schemas",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "job_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("jobs.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column(
            "criteria",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("human_weight", sa.Float(), nullable=False, server_default="0.5"),
        sa.Column("llm_weight", sa.Float(), nullable=False, server_default="0.5"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_job_evaluation_schemas_job_id",
        "job_evaluation_schemas",
        ["job_id"],
    )

    op.create_table(
        "candidate_evaluation_scores",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "application_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("applications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "job_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("jobs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "schema_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("job_evaluation_schemas.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("schema_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("evaluator_type", sa.String(length=10), nullable=False),
        sa.Column(
            "scores",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "criteria_snapshot",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("weighted_total", sa.Float(), nullable=True),
        sa.Column(
            "submitted_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "application_id",
            "evaluator_type",
            name="uq_candidate_evaluation_application_evaluator",
        ),
    )
    op.create_index(
        "ix_candidate_evaluation_scores_application_id",
        "candidate_evaluation_scores",
        ["application_id"],
    )
    op.create_index(
        "ix_candidate_evaluation_scores_job_id",
        "candidate_evaluation_scores",
        ["job_id"],
    )
    op.create_index(
        "ix_candidate_evaluation_scores_schema_id",
        "candidate_evaluation_scores",
        ["schema_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_candidate_evaluation_scores_schema_id",
        table_name="candidate_evaluation_scores",
    )
    op.drop_index(
        "ix_candidate_evaluation_scores_job_id",
        table_name="candidate_evaluation_scores",
    )
    op.drop_index(
        "ix_candidate_evaluation_scores_application_id",
        table_name="candidate_evaluation_scores",
    )
    op.drop_table("candidate_evaluation_scores")
    op.drop_index(
        "ix_job_evaluation_schemas_job_id", table_name="job_evaluation_schemas"
    )
    op.drop_table("job_evaluation_schemas")

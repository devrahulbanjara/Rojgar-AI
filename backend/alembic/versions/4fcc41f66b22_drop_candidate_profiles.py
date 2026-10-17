"""Drop candidate profiles and CV import tasks (no profile builder any more).

Applicants are people with applications; their CV lives on the application's
resume row.

Revision ID: 4fcc41f66b22
Revises: 600624654338
Create Date: 2026-10-17
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "4fcc41f66b22"
down_revision: str | None = "600624654338"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    for table in (
        "profile_experiences",
        "profile_educations",
        "profile_skills",
        "profiles",
        "resume_import_tasks",
    ):
        op.drop_table(table)


def _child(name: str, *columns: sa.Column) -> None:
    op.create_table(
        name,
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "profile_id",
            sa.Uuid(),
            sa.ForeignKey("profiles.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        *columns,
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.create_table(
        "resume_import_tasks",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("source_file_name", sa.String(255)),
        sa.Column("result_data", postgresql.JSONB()),
        sa.Column("error_message", sa.Text()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
    )
    op.create_table(
        "profiles",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("headline", sa.String(255)),
        sa.Column("summary", sa.Text()),
        sa.Column("phone", sa.String(30)),
        sa.Column("location", sa.String(255)),
        sa.Column("linkedin_url", sa.String(500)),
        sa.Column("github_url", sa.String(500)),
        sa.Column("portfolio_url", sa.String(500)),
        sa.Column("years_of_experience", sa.Integer()),
        sa.Column("target_roles", postgresql.ARRAY(sa.String()), server_default="{}"),
        sa.Column(
            "is_open_to_work", sa.Boolean(), server_default="false", nullable=False
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
    )
    _child(
        "profile_experiences",
        sa.Column("company_name", sa.String(255), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("start_date", sa.Date()),
        sa.Column("end_date", sa.Date()),
        sa.Column("description", postgresql.ARRAY(sa.String()), server_default="{}"),
    )
    _child(
        "profile_educations",
        sa.Column("institution", sa.String(255), nullable=False),
        sa.Column("degree", sa.String(255)),
        sa.Column("field_of_study", sa.String(255)),
        sa.Column("start_date", sa.Date()),
        sa.Column("end_date", sa.Date()),
    )
    _child("profile_skills", sa.Column("skill_name", sa.String(100), nullable=False))

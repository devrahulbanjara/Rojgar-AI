"""add application share settings

Revision ID: b7c4a9d3e2f1
Revises: a4d9e8c7b6f5
Create Date: 2026-03-29
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b7c4a9d3e2f1"
down_revision = "2481d6c7715f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "applications",
        sa.Column(
            "share_profile_all", sa.Boolean(), nullable=False, server_default="true"
        ),
    )
    op.add_column(
        "applications",
        sa.Column("share_avatar", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.add_column(
        "applications",
        sa.Column("share_email", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.add_column(
        "applications",
        sa.Column("share_phone", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.add_column(
        "applications",
        sa.Column(
            "share_location", sa.Boolean(), nullable=False, server_default="true"
        ),
    )
    op.add_column(
        "applications",
        sa.Column("share_links", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.add_column(
        "applications",
        sa.Column(
            "share_headline_summary",
            sa.Boolean(),
            nullable=False,
            server_default="true",
        ),
    )


def downgrade() -> None:
    op.drop_column("applications", "share_headline_summary")
    op.drop_column("applications", "share_links")
    op.drop_column("applications", "share_location")
    op.drop_column("applications", "share_phone")
    op.drop_column("applications", "share_email")
    op.drop_column("applications", "share_avatar")
    op.drop_column("applications", "share_profile_all")

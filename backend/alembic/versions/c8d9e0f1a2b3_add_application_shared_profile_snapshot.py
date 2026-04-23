"""add application shared profile snapshot

Revision ID: c8d9e0f1a2b3
Revises: b7c4a9d3e2f1
Create Date: 2026-03-29
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c8d9e0f1a2b3"
down_revision = "b7c4a9d3e2f1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Apply the shared application profile-snapshot migration."""
    op.add_column(
        "applications", sa.Column("shared_full_name", sa.Text(), nullable=True)
    )
    op.add_column(
        "applications", sa.Column("shared_avatar_url", sa.Text(), nullable=True)
    )
    op.add_column(
        "applications", sa.Column("shared_email_value", sa.Text(), nullable=True)
    )
    op.add_column(
        "applications", sa.Column("shared_phone_value", sa.Text(), nullable=True)
    )
    op.add_column(
        "applications", sa.Column("shared_location_value", sa.Text(), nullable=True)
    )
    op.add_column(
        "applications", sa.Column("shared_headline_value", sa.Text(), nullable=True)
    )
    op.add_column(
        "applications", sa.Column("shared_summary_value", sa.Text(), nullable=True)
    )
    op.add_column(
        "applications", sa.Column("shared_linkedin_url", sa.Text(), nullable=True)
    )
    op.add_column(
        "applications", sa.Column("shared_github_url", sa.Text(), nullable=True)
    )
    op.add_column(
        "applications", sa.Column("shared_portfolio_url", sa.Text(), nullable=True)
    )

    op.execute(
        """
        UPDATE applications AS a
        SET
            shared_full_name = u.full_name,
            shared_avatar_url = CASE
                WHEN a.share_profile_all OR a.share_avatar THEN u.avatar_url
                ELSE NULL
            END,
            shared_email_value = u.email,
            shared_phone_value = CASE
                WHEN a.share_profile_all OR a.share_phone THEN p.phone
                ELSE NULL
            END,
            shared_location_value = CASE
                WHEN a.share_profile_all OR a.share_location THEN p.location
                ELSE NULL
            END,
            shared_headline_value = CASE
                WHEN a.share_profile_all OR a.share_headline_summary THEN p.headline
                ELSE NULL
            END,
            shared_summary_value = CASE
                WHEN a.share_profile_all OR a.share_headline_summary THEN p.summary
                ELSE NULL
            END,
            shared_linkedin_url = CASE
                WHEN a.share_profile_all OR a.share_links THEN p.linkedin_url
                ELSE NULL
            END,
            shared_github_url = CASE
                WHEN a.share_profile_all OR a.share_links THEN p.github_url
                ELSE NULL
            END,
            shared_portfolio_url = CASE
                WHEN a.share_profile_all OR a.share_links THEN p.portfolio_url
                ELSE NULL
            END
        FROM users AS u
        LEFT JOIN profiles AS p ON p.user_id = u.id
        WHERE a.user_id = u.id
        """
    )


def downgrade() -> None:
    """Revert the shared application profile-snapshot migration."""
    op.drop_column("applications", "shared_portfolio_url")
    op.drop_column("applications", "shared_github_url")
    op.drop_column("applications", "shared_linkedin_url")
    op.drop_column("applications", "shared_summary_value")
    op.drop_column("applications", "shared_headline_value")
    op.drop_column("applications", "shared_location_value")
    op.drop_column("applications", "shared_phone_value")
    op.drop_column("applications", "shared_email_value")
    op.drop_column("applications", "shared_avatar_url")
    op.drop_column("applications", "shared_full_name")

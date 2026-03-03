"""add_company_admin_roles_and_location

Revision ID: acf8f33daa0b
Revises: 9ed78371f981
Create Date: 2026-03-03 22:21:54.715392

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'acf8f33daa0b'
down_revision: Union[str, Sequence[str], None] = '9ed78371f981'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add 'company' and 'admin' to the userrole PostgreSQL enum.
    # Enum ALTER must run outside an explicit transaction block on PG < 12;
    # on PG 12+ IF NOT EXISTS guarantees it is idempotent inside one.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'company'")
        op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'admin'")

    # Add the location column to companies
    op.add_column(
        'companies',
        sa.Column('location', sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('companies', 'location')
    # Note: PostgreSQL does not support removing enum values natively.
    # To fully revert, recreate the enum without 'company'/'admin'.

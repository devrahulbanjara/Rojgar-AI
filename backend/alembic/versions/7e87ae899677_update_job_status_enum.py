"""update_job_status_enum

Revision ID: 7e87ae899677
Revises: c3f7a2b91d04
Create Date: 2026-03-08 10:00:00.000000

"""

from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7e87ae899677"
down_revision: Union[str, Sequence[str], None] = "c3f7a2b91d04"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Drop the existing default constraint so Postgres allows the type change
    op.execute("ALTER TABLE jobs ALTER COLUMN status DROP DEFAULT")

    # 2. Rename old enum to avoid conflict
    op.execute("ALTER TYPE jobstatus RENAME TO jobstatus_old")

    # 3. Create the new enum type
    op.execute("CREATE TYPE jobstatus AS ENUM ('active', 'expired', 'draft')")

    # 4. Convert the column data using the mapping logic
    op.execute(
        "ALTER TABLE jobs ALTER COLUMN status TYPE jobstatus USING "
        "CASE "
        "  WHEN status::text = 'open' THEN 'active'::jobstatus "
        "  WHEN status::text = 'closed' THEN 'expired'::jobstatus "
        "  WHEN status::text = 'archived' THEN 'expired'::jobstatus "
        "  WHEN status::text = 'active' THEN 'active'::jobstatus "
        "  ELSE 'draft'::jobstatus "
        "END"
    )

    # 5. Re-apply the default value with the new type
    op.execute("ALTER TABLE jobs ALTER COLUMN status SET DEFAULT 'draft'::jobstatus")

    # 6. Clean up old type
    op.execute("DROP TYPE jobstatus_old")


def downgrade() -> None:
    # 1. Drop default
    op.execute("ALTER TABLE jobs ALTER COLUMN status DROP DEFAULT")

    # 2. Rename new to temp
    op.execute("ALTER TYPE jobstatus RENAME TO jobstatus_new")

    # 3. Recreate original
    op.execute("CREATE TYPE jobstatus AS ENUM ('draft', 'open', 'closed', 'archived')")

    # 4. Map back
    op.execute(
        "ALTER TABLE jobs ALTER COLUMN status TYPE jobstatus USING "
        "CASE "
        "  WHEN status::text = 'active' THEN 'open'::jobstatus "
        "  WHEN status::text = 'expired' THEN 'closed'::jobstatus "
        "  ELSE 'draft'::jobstatus "
        "END"
    )

    # 5. Restore original default
    op.execute("ALTER TABLE jobs ALTER COLUMN status SET DEFAULT 'draft'::jobstatus")

    # 6. Drop temp
    op.execute("DROP TYPE jobstatus_new")

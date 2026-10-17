"""People without global roles, businesses with verification, invites, phone
sign-in codes, job reports and platform admins.

- users.primary_role is dropped; users.is_platform_admin is added. Phone and a
  nullable email are added idempotently (data model v2 adds the same columns).
- Membership roles: admin -> owner, recruiter -> manager (+ interviewer).
  Candidates had no membership and get none.
- Membership status now means "the business this person works in now"
  (active | inactive, at most one active per person). Pending and rejected
  join requests are deleted: joining is by invite link only.
- Businesses get a verification status. Existing ones are already trading on
  the platform, so they start active (verified).

Revision ID: 448c86788f39
Revises: 668b934a505f
Create Date: 2026-10-17
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "448c86788f39"
down_revision: Union[str, None] = "668b934a505f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Old membership role -> new business role.
ROLE_MAP = {"admin": "owner", "recruiter": "manager"}


def _case(column: str, mapping: dict[str, str], default: str) -> str:
    whens = " ".join(f"WHEN '{old}' THEN '{new}'" for old, new in mapping.items())
    return f"CASE {column}::text {whens} ELSE '{default}' END"


def _retype(table: str, column: str, type_name: str, values: list[str], using: str):
    op.execute(f"ALTER TYPE {type_name} RENAME TO {type_name}_old")
    sa.Enum(*values, name=type_name).create(op.get_bind())
    op.execute(
        f"ALTER TABLE {table} ALTER COLUMN {column} TYPE {type_name} "
        f"USING ({using})::{type_name}"
    )
    op.execute(f"DROP TYPE {type_name}_old")


def upgrade() -> None:
    # ---- people ---------------------------------------------------------
    op.execute("ALTER TABLE users ALTER COLUMN email DROP NOT NULL")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)")
    op.execute(
        """
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_users_phone')
          THEN ALTER TABLE users ADD CONSTRAINT uq_users_phone UNIQUE (phone);
          END IF;
        END $$
        """
    )
    op.add_column(
        "users",
        sa.Column(
            "is_platform_admin", sa.Boolean(), nullable=False, server_default="false"
        ),
    )

    # ---- memberships ----------------------------------------------------
    op.execute("DELETE FROM company_memberships WHERE status <> 'active'")
    op.execute("ALTER TABLE company_memberships ALTER COLUMN status DROP DEFAULT")
    _retype(
        "company_memberships",
        "role",
        "membershiprole",
        ["owner", "manager", "interviewer"],
        _case("role", ROLE_MAP, "manager"),
    )
    _retype(
        "company_memberships",
        "status",
        "membershipstatus",
        ["active", "inactive"],
        "status::text",
    )
    # One row per person per business, newest kept.
    op.execute(
        """
        DELETE FROM company_memberships m USING company_memberships n
        WHERE m.user_id = n.user_id AND m.company_id = n.company_id
          AND (m.created_at, m.id) < (n.created_at, n.id)
        """
    )
    # At most one active business per person: the newest stays active.
    op.execute(
        """
        UPDATE company_memberships m SET status = 'inactive'
        WHERE m.status = 'active' AND EXISTS (
          SELECT 1 FROM company_memberships n
          WHERE n.user_id = m.user_id AND n.status = 'active'
            AND (n.created_at, n.id) > (m.created_at, m.id))
        """
    )
    op.execute(
        "ALTER TABLE company_memberships ALTER COLUMN status SET DEFAULT 'active'"
    )
    op.create_unique_constraint(
        "uq_membership_user_company", "company_memberships", ["user_id", "company_id"]
    )
    op.create_index(
        "uq_membership_one_active_per_user",
        "company_memberships",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("status = 'active'"),
    )

    op.drop_column("users", "primary_role")
    op.execute("DROP TYPE IF EXISTS userrole")

    # ---- businesses -----------------------------------------------------
    business_status = sa.Enum(
        "pending", "active", "suspended", "rejected", name="businessstatus"
    )
    business_status.create(op.get_bind())
    op.add_column(
        "companies",
        sa.Column("status", business_status, nullable=False, server_default="pending"),
    )
    op.add_column("companies", sa.Column("status_reason", sa.Text(), nullable=True))
    op.add_column(
        "companies",
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column("companies", sa.Column("district", sa.String(40), nullable=True))
    op.add_column("companies", sa.Column("phone", sa.String(20), nullable=True))
    op.add_column("companies", sa.Column("pan_number", sa.String(20), nullable=True))
    op.add_column(
        "companies", sa.Column("registration_doc_key", sa.String(255), nullable=True)
    )
    op.add_column(
        "companies",
        sa.Column(
            "created_by_user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.execute("UPDATE companies SET status = 'active', verified_at = created_at")
    op.execute(
        """
        UPDATE companies c SET created_by_user_id = (
          SELECT m.user_id FROM company_memberships m
          WHERE m.company_id = c.id AND m.role = 'owner'
          ORDER BY m.created_at LIMIT 1)
        """
    )
    op.drop_index("ix_companies_name_lower", table_name="companies")
    op.create_index("ix_companies_name_lower", "companies", [sa.text("lower(name)")])

    # ---- new tables -----------------------------------------------------
    op.create_table(
        "business_invites",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "company_id",
            sa.Uuid(),
            sa.ForeignKey("companies.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "role",
            postgresql.ENUM(name="membershiprole", create_type=False),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column(
            "created_by_user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True)),
        sa.Column(
            "accepted_by_user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
        ),
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
    )
    op.create_table(
        "phone_otps",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("phone", sa.String(20), nullable=False, index=True),
        sa.Column("code_hash", sa.String(64), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
    )
    op.create_table(
        "job_reports",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "job_id",
            sa.Uuid(),
            sa.ForeignKey("jobs.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "company_id",
            sa.Uuid(),
            sa.ForeignKey("companies.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("source", sa.String(20), nullable=False),
        sa.Column("reason", sa.String(30), nullable=False),
        sa.Column("details", sa.Text()),
        sa.Column("reporter_ip_hash", sa.String(64)),
        sa.Column("resolved_at", sa.DateTime(timezone=True)),
        sa.Column(
            "resolved_by_user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
        ),
        sa.Column("resolution", sa.String(30)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            index=True,
        ),
    )
    op.create_table(
        "job_takedowns",
        sa.Column(
            "job_id",
            sa.Uuid(),
            sa.ForeignKey("jobs.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("reason", sa.Text()),
        sa.Column(
            "created_by_user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
    )
    op.create_table(
        "manual_payments",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "company_id",
            sa.Uuid(),
            sa.ForeignKey("companies.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("kind", sa.String(20), nullable=False),
        sa.Column(
            "job_id", sa.Uuid(), sa.ForeignKey("jobs.id", ondelete="SET NULL")
        ),
        sa.Column("amount_npr", sa.Integer(), nullable=False),
        sa.Column("reference", sa.String(100)),
        sa.Column("status", sa.String(20), nullable=False, server_default="awaiting"),
        sa.Column("received_at", sa.DateTime(timezone=True)),
        sa.Column(
            "received_by_user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
    )


def downgrade() -> None:
    """Back to global roles. Phone and the nullable email stay (shared with
    data model v2); deleted join requests and new tables' rows are not restored."""
    op.drop_table("manual_payments")
    op.drop_table("job_takedowns")
    op.drop_table("job_reports")
    op.drop_table("phone_otps")
    op.drop_table("business_invites")

    op.drop_index("ix_companies_name_lower", table_name="companies")
    op.create_index(
        "ix_companies_name_lower", "companies", [sa.text("lower(name)")], unique=True
    )
    for column in (
        "created_by_user_id",
        "registration_doc_key",
        "pan_number",
        "phone",
        "district",
        "verified_at",
        "status_reason",
        "status",
    ):
        op.drop_column("companies", column)
    op.execute("DROP TYPE businessstatus")

    userrole = sa.Enum("candidate", "recruiter", "recruiter_admin", name="userrole")
    userrole.create(op.get_bind())
    op.add_column(
        "users",
        sa.Column("primary_role", userrole, nullable=False, server_default="candidate"),
    )
    op.execute(
        """
        UPDATE users u SET primary_role = CASE
          WHEN EXISTS (SELECT 1 FROM company_memberships m
                       WHERE m.user_id = u.id AND m.role = 'owner') THEN 'recruiter_admin'
          WHEN EXISTS (SELECT 1 FROM company_memberships m WHERE m.user_id = u.id)
            THEN 'recruiter'
          ELSE 'candidate' END::userrole
        """
    )
    op.alter_column("users", "primary_role", server_default=None)

    op.drop_index("uq_membership_one_active_per_user", table_name="company_memberships")
    op.drop_constraint(
        "uq_membership_user_company", "company_memberships", type_="unique"
    )
    op.execute("ALTER TABLE company_memberships ALTER COLUMN status DROP DEFAULT")
    _retype(
        "company_memberships",
        "status",
        "membershipstatus",
        ["pending", "active", "rejected"],
        "'active'",
    )
    op.execute(
        "ALTER TABLE company_memberships ALTER COLUMN status SET DEFAULT 'pending'"
    )
    _retype(
        "company_memberships",
        "role",
        "membershiprole",
        ["admin", "recruiter"],
        _case("role", {"owner": "admin"}, "recruiter"),
    )
    op.drop_column("users", "is_platform_admin")

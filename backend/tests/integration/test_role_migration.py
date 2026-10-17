"""Migration 448c86788f39 on the old schema shape: roles map, data is kept.

Runs the real upgrade and downgrade inside a throwaway schema in one
transaction that is rolled back, so the test database is untouched.
"""

import importlib.util
import uuid
from pathlib import Path

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import text

MIGRATION = (
    Path(__file__).resolve().parents[2]
    / "alembic/versions/448c86788f39_people_businesses_and_platform_admin.py"
)

OLD_SCHEMA = """
CREATE TYPE userrole AS ENUM ('candidate', 'recruiter', 'recruiter_admin');
CREATE TYPE membershiprole AS ENUM ('admin', 'recruiter');
CREATE TYPE membershipstatus AS ENUM ('pending', 'active', 'rejected');
CREATE TABLE users (
  id uuid PRIMARY KEY, email varchar(255) NOT NULL, primary_role userrole NOT NULL);
CREATE TABLE companies (
  id uuid PRIMARY KEY, name varchar(255) NOT NULL,
  created_at timestamptz DEFAULT now());
CREATE UNIQUE INDEX ix_companies_name_lower ON companies (lower(name));
CREATE TABLE company_memberships (
  id uuid PRIMARY KEY, user_id uuid REFERENCES users(id),
  company_id uuid REFERENCES companies(id), role membershiprole NOT NULL,
  status membershipstatus NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now());
CREATE TABLE jobs (id uuid PRIMARY KEY);
"""


def _load_migration():
    spec = importlib.util.spec_from_file_location("mig_448c", MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _run(connection) -> dict:
    schema = f"mig_{uuid.uuid4().hex[:8]}"
    connection.execute(text(f"CREATE SCHEMA {schema}"))
    connection.execute(text(f"SET LOCAL search_path TO {schema}"))
    for statement in OLD_SCHEMA.split(";"):
        if statement.strip():
            connection.execute(text(statement))

    ids = {name: uuid.uuid4() for name in ("admin", "rec", "cand", "waiting", "co")}
    connection.execute(
        text(
            "INSERT INTO users (id, email, primary_role) VALUES "
            "(:admin, 'a@x.com', 'recruiter_admin'), (:rec, 'r@x.com', 'recruiter'),"
            "(:cand, 'c@x.com', 'candidate'), (:waiting, 'w@x.com', 'recruiter')"
        ),
        ids,
    )
    connection.execute(
        text("INSERT INTO companies (id, name) VALUES (:co, 'Acme')"), ids
    )
    connection.execute(
        text(
            "INSERT INTO company_memberships (id, user_id, company_id, role, status) VALUES"
            " (gen_random_uuid(), :admin, :co, 'admin', 'active'),"
            " (gen_random_uuid(), :rec, :co, 'recruiter', 'active'),"
            " (gen_random_uuid(), :waiting, :co, 'recruiter', 'pending')"
        ),
        ids,
    )

    migration = _load_migration()
    context = MigrationContext.configure(connection)
    with Operations.context(context):
        migration.upgrade()

    upgraded = {
        "roles": dict(
            connection.execute(
                text(
                    "SELECT u.email, m.role::text FROM company_memberships m "
                    "JOIN users u ON u.id = m.user_id"
                )
            ).all()
        ),
        "statuses": set(
            connection.execute(
                text("SELECT status::text FROM company_memberships")
            ).scalars()
        ),
        "users": connection.execute(text("SELECT count(*) FROM users")).scalar(),
        "has_primary_role": connection.execute(
            text(
                "SELECT count(*) FROM information_schema.columns WHERE "
                "table_schema = :s AND table_name = 'users' "
                "AND column_name = 'primary_role'"
            ),
            {"s": schema},
        ).scalar(),
        "company": connection.execute(
            text("SELECT status::text, created_by_user_id FROM companies")
        ).one(),
    }

    with Operations.context(context):
        migration.downgrade()
    upgraded["downgraded_roles"] = dict(
        connection.execute(text("SELECT email, primary_role::text FROM users")).all()
    )
    upgraded["ids"] = ids
    return upgraded


async def test_roles_map_and_data_is_kept(engine):
    async with engine.connect() as conn:
        transaction = await conn.begin()
        try:
            result = await conn.run_sync(_run)
        finally:
            await transaction.rollback()

    # recruiter_admin -> owner, recruiter -> manager, candidate -> no membership;
    # the pending join request is gone, the person stays.
    assert result["roles"] == {"a@x.com": "owner", "r@x.com": "manager"}
    assert result["statuses"] == {"active"}
    assert result["users"] == 4
    assert result["has_primary_role"] == 0
    status, created_by = result["company"]
    assert status == "active" and created_by == result["ids"]["admin"]

    assert result["downgraded_roles"] == {
        "a@x.com": "recruiter_admin",
        "r@x.com": "recruiter",
        "c@x.com": "candidate",
        "w@x.com": "candidate",
    }

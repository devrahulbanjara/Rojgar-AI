#!/bin/sh
set -e

# If schema tables already exist but alembic_version is missing,
# stamp the initial revision so upgrades can continue safely.
echo "Checking database migration state..."
MIGRATION_STATE="$(python - <<'PY'
from sqlalchemy import create_engine, text

from app.core.config import settings

database_url = settings.database_url.replace("+asyncpg", "+psycopg2")
engine = create_engine(database_url)

with engine.connect() as connection:
    has_alembic_version = bool(
        connection.execute(
            text("SELECT to_regclass('public.alembic_version') IS NOT NULL")
        ).scalar()
    )
    has_user_tables = bool(
        connection.execute(
            text(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                      AND table_type = 'BASE TABLE'
                      AND table_name <> 'alembic_version'
                )
                """
            )
        ).scalar()
    )

if (not has_alembic_version) and has_user_tables:
    print("STAMP_INITIAL")
else:
    print("UPGRADE")
PY
)"

if [ "$MIGRATION_STATE" = "STAMP_INITIAL" ]; then
    echo "Detected existing schema without Alembic tracking. Stamping current head..."
    alembic stamp c4b8e1d9f2a7
fi

echo "Applying database migrations..."
alembic upgrade head

# Start the application
echo "Starting FastAPI server..."
exec "$@"

#!/bin/bash
set -e

# Apply database migrations
echo "Applying database migrations..."
alembic upgrade head

# Start the application
echo "Starting FastAPI server..."
exec "$@"

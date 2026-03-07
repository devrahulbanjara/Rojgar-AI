# Stage 1: Build stage
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder
ENV UV_COMPILE_BYTECODE=1
WORKDIR /app

# Install dependencies using cache mounts
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project --no-dev

# Stage 2: Final runtime stage
FROM python:3.12-slim
WORKDIR /app

# Copy the virtual environment
COPY --from=builder /app/.venv /app/.venv

# Copy all application files based on your directory structure
COPY main.py alembic.ini hybrid_matching.py entrypoint.sh ./
COPY app ./app
COPY alembic ./alembic

# Make the entrypoint script executable
RUN chmod +x entrypoint.sh

# Set environment paths and flags
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Use the script to run migrations then start the app
ENTRYPOINT ["./entrypoint.sh"]
CMD ["fastapi", "run", "main.py", "--port", "8000", "--host", "0.0.0.0"]

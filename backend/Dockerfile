# Stage 1: Build
FROM python:3.12-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:0.7.12 /uv /bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

# Copy dependency files first (separate layer for caching)
COPY pyproject.toml uv.lock ./

# Install deps only (not the project) — cached layer
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

# Copy app code
COPY main.py alembic.ini entrypoint.sh ml_bouncer_model.pkl ./
COPY app ./app
COPY alembic ./alembic

# Install the project itself
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# Stage 2: Runtime
FROM python:3.12-slim

# ffmpeg: interview recordings (webm/mp4/ogg/m4a) are transcoded before ASR.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r app && useradd -r -d /app -g app app

WORKDIR /app

COPY --from=builder --chown=app:app /app /app

RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh
# Fail the build if the ML pre-filter model is missing; without it every
# application would silently be scored 1.0 and auto-shortlisted.
RUN test -s /app/ml_bouncer_model.pkl
RUN mkdir -p /app/logs && chown -R app:app /app

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4).status == 200 else 1)"

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["fastapi", "run", "main.py", "--port", "8000", "--host", "0.0.0.0"]

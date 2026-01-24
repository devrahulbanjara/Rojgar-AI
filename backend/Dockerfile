FROM python:3.12-slim-trixie

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set working directory
WORKDIR /app

# Copy project metadata and install dependencies
COPY pyproject.toml uv.lock ./
RUN uv sync --locked

# Copy application code
COPY main.py ./
COPY app ./app

# Expose port (optional)
EXPOSE 8000

# Run FastAPI in prod mode
CMD ["uv", "run", "fastapi", "run"]

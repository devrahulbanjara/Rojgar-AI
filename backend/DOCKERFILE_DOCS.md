## The full Dockerfile, line by line

```dockerfile
# Stage 1: Build stage
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder
```

### `FROM`
Every Dockerfile starts with `FROM`. You're saying: "start with this existing image as my base." You never build from absolute zero — you stand on something.

`ghcr.io/astral-sh/uv:python3.12-bookworm-slim` breaks down as:

- `ghcr.io` — GitHub Container Registry (where the image lives)
- `astral-sh/uv` — the org/repo, published by Astral (makers of uv)
- `python3.12-bookworm-slim` — the **tag**, which specifies: Python 3.12, Debian Bookworm (Debian 12), slim variant (stripped down, no extras)

### `AS builder`
This names the stage `builder`. This is **multi-stage build** syntax. You'll use this name later to copy things out of this stage. More on multi-stage below.

---

```dockerfile
ENV UV_COMPILE_BYTECODE=1
```

### `ENV`
Sets an environment variable inside the image. This persists — every subsequent layer and the final running container will have this variable set.

`UV_COMPILE_BYTECODE=1` tells uv to compile `.py` files to `.pyc` bytecode during install. Python normally does this on first import. Doing it at build time means faster cold starts when your container boots — the CPU work is already done.

---

```dockerfile
WORKDIR /app
```

### `WORKDIR`
Sets the working directory for all subsequent instructions. If `/app` doesn't exist, Docker creates it.

Every `RUN`, `COPY`, `CMD` after this operates relative to `/app`. It's like doing `mkdir -p /app && cd /app` and staying there for the rest of the file.

---

```dockerfile
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project --no-dev
```

### `RUN`
Executes a shell command during build time. The result becomes a new layer in the image.

The `\` at the end of lines is just line continuation — it's one command split across multiple lines for readability.

### `--mount=type=cache,target=/root/.cache/uv`
This is a **BuildKit cache mount**. It mounts a persistent cache directory at that path during this RUN step only. The cache is not included in the final image layer — it's just available during the build.

Why? uv downloads packages from the internet. Without a cache mount, every build re-downloads everything. With it, uv checks the cache first — subsequent builds are dramatically faster.

### `--mount=type=bind,source=uv.lock,target=uv.lock`
A **bind mount** makes a file from your host machine available inside the build container temporarily — again, not baked into the image. You're making `uv.lock` and `pyproject.toml` available for uv to read, without COPYing them into the image at this point.

Why not just COPY them? You could. But bind mounts during RUN don't create a layer with those files. It's slightly cleaner — the files are only needed for the install step, not the final image.

### `uv sync --frozen --no-install-project --no-dev`
- `--frozen` — use exactly what's in `uv.lock`, don't resolve or update anything
- `--no-install-project` — install dependencies only, not the project itself (your actual app code). This is the key caching trick — deps change rarely, your code changes constantly. Separating them means the dep layer stays cached.
- `--no-dev` — skip dev dependencies (pytest, ruff, etc). Production image doesn't need them.

---

```dockerfile
# Stage 2: Final runtime stage
FROM python:3.12-slim
```

### Second `FROM` — Multi-stage builds

This starts a **brand new stage**. Fresh slate. Nothing from Stage 1 carries over automatically.

`python:3.12-slim` is a much leaner base — just Python on minimal Debian. Crucially, **uv is not in this image**. uv is only a build tool. You don't need it at runtime.

**This is the whole point of multi-stage builds:** Stage 1 has all the heavy build machinery (uv, compilers, caches). Stage 2 is the lean runtime image. You copy only what you need from Stage 1, and throw the rest away.

The final image pushed to ECR is **only Stage 2**. Stage 1 never leaves your build machine.

---

```dockerfile
WORKDIR /app
```

Same as before — set working directory in this new stage.

---

```dockerfile
COPY --from=builder /app/.venv /app/.venv
```

### `COPY --from=builder`
Copy from a previous stage. You're grabbing the `.venv` directory that uv populated in Stage 1 and bringing it into Stage 2.

This is the hand-off. All your installed packages (FastAPI, SQLAlchemy, LangChain, etc.) live in `.venv`. You're transplanting them into the clean runtime image without bringing along uv itself.

---

```dockerfile
COPY main.py alembic.ini hybrid_matching.py entrypoint.sh ./
COPY app ./app
COPY alembic ./alembic
```

### `COPY` (from host)
When there's no `--from`, it copies from your **local machine** (the build context — the directory you ran `docker build` from) into the image.

- `COPY main.py alembic.ini hybrid_matching.py entrypoint.sh ./` — copies these four specific files into `/app/`
- `COPY app ./app` — copies your `app/` directory to `/app/app/`
- `COPY alembic ./alembic` — copies migrations

Why is this after the venv copy? **Layer caching.** Your app code changes constantly. Your dependencies rarely change. By putting the venv copy first, Docker can reuse that expensive layer on every code change. If you COPYed app code first, any code change would invalidate the cache for everything after it, including the venv.

---

```dockerfile
RUN chmod +x entrypoint.sh
```

Makes the entrypoint script executable. Without this, the OS won't let you run it as a program. Same as `chmod +x` on your local machine.

---

```dockerfile
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
```

`PATH="/app/.venv/bin:$PATH"` — prepends the venv's bin directory to PATH. This is how you "activate" a virtual environment without sourcing it. When the container runs `python` or `fastapi`, the OS looks through PATH in order and finds the venv's versions first.

`PYTHONUNBUFFERED=1` — Python by default buffers stdout/stderr output. In a container, this means logs might not appear in real time — they sit in a buffer and flush in chunks. Setting this to 1 disables buffering. Your `print()` statements and log lines show up immediately in `docker logs`.

---

```dockerfile
EXPOSE 8000
```

### `EXPOSE`
Documentation instruction. It tells anyone reading the Dockerfile (and Docker tooling) that this container listens on port 8000. It does **not** actually publish the port to your host machine — that's done with `-p 8000:8000` when you run the container.

Think of EXPOSE as: "this container has a door at 8000." `-p` is: "connect your host's port 8000 to that door."

---

```dockerfile
ENTRYPOINT ["./entrypoint.sh"]
CMD ["fastapi", "run", "main.py", "--port", "8000", "--host", "0.0.0.0"]
```

### `ENTRYPOINT` vs `CMD`

This trips up almost everyone. Here's the clean mental model:

**ENTRYPOINT** — the fixed executable. Always runs. Hard to override.

**CMD** — default arguments passed to ENTRYPOINT. Easy to override at runtime.

Together, Docker runs: `./entrypoint.sh fastapi run main.py --port 8000 --host 0.0.0.0`

Your `entrypoint.sh` ends with `exec "$@"` — `$@` means "all arguments passed to this script." So the script runs migrations, then hands off execution to `fastapi run main.py --port 8000 --host 0.0.0.0`.

**Why `exec`?** Without `exec`, your shell script runs as PID 1, and it spawns `fastapi` as a child process. With `exec`, it *replaces* itself with the fastapi process. The fastapi process becomes PID 1. This matters because Docker sends signals (like SIGTERM for graceful shutdown) to PID 1. If your app isn't PID 1, it doesn't receive the shutdown signal cleanly.

**Why arrays `["...", "..."]` not strings `"..."`?**
Array form (exec form) runs the command directly. String form runs it through `/bin/sh -c "..."`, which adds a shell in between and causes the PID 1 problem again.

---

## The complete picture — what happens when you run `docker build`

```
1. Docker reads FROM — pulls python:3.12-bookworm-slim (or uses cache)
2. Sets ENV UV_COMPILE_BYTECODE=1
3. Creates /app directory, sets it as workdir
4. Runs uv sync — installs all packages into .venv
   (uv is available because Stage 1's base image includes it)
5. Pulls python:3.12-slim for Stage 2
6. Creates /app, sets workdir
7. Copies .venv from Stage 1
8. Copies your app code from local machine
9. Makes entrypoint.sh executable
10. Sets PATH and PYTHONUNBUFFERED
11. Records EXPOSE and ENTRYPOINT/CMD metadata
12. Final image is sealed — only Stage 2 layers exist
```

When you run the container:
```
1. Container starts
2. entrypoint.sh runs
3. alembic upgrade head runs against your real DB
4. exec hands off to fastapi run
5. Your API is live on port 8000
```
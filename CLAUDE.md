# ConvexHire Repository Guidelines

ConvexHire is an AI-assisted hiring platform that runs the full recruitment funnel for both sides of the market. Recruiters can register companies, manage team access, create jobs manually or with AI, review applications, run AI screening, shortlist candidates manually or with AI, manage outreach, interviews, interview evaluations, and final decisions, and use a persistent recruiter chat assistant connected to live platform data for candidate search, job lookup, job edits with preview-and-confirm, salary research, and session history. Candidates can onboard, build profiles, import or create resumes, discover and filter jobs, preview job details, run resume gap analysis during apply flow, choose how to act on those gaps before submitting, apply with selected resumes, and track application progress, AI feedback, interviews, and outcomes from application through offer.

Early-stage startup. Ship clean, complete, non-overengineered features.

## Repo Layout

- Backend code lives under `backend/app/`
- Frontend code lives under `frontend/src/`
- Backend tests live under `backend/tests/`

Use repo-accurate paths in changes, discussions, and commands. Do not refer to `app/...` or `src/...` as if they were repo-root folders.

## Stack

- Backend: Python 3.12, FastAPI, SQLAlchemy 2 async, Pydantic v2, Alembic, PostgreSQL, Redis, Qdrant, LangChain v1.x, LangGraph, UV
- Frontend: Next.js 16 App Router, React 19, TypeScript, RTK Query, SSE via raw fetch, SCSS, pnpm
- AI: Groq for chat, job drafting, and resume gap; AWS Bedrock only for shortlisting

Use web search when latest syntax or API behavior may have changed.

## Backend

Backend modules are under `backend/app/modules/<domain>/` and should generally follow:

- `models.py`
- `schemas.py`
- `helpers.py`
- `service.py`
- `router.py`

Rules:

- Keep routers thin.
- Put orchestration in services.
- Keep helpers pure.
- Put infra integrations under `backend/app/infrastructures/<name>/service.py`.
- Use response builders from `backend/app/core/responses.py`.
- Use Python 3.12 typing syntax such as `str | None`, `list[str]`, `dict[str, Any]`.
- Keep code async end-to-end where applicable.
- Raise domain-specific exceptions, not bare `Exception`.

LangGraph rules:

- Nodes should be `async def`
- State should be `TypedDict`
- Use `ainvoke` in FastAPI paths
- Bedrock is for the shortlisting graph only

## Frontend

Frontend app code is under `frontend/src/`:

- `frontend/src/app/` for App Router pages and route-local `_components`
- `frontend/src/components/` for shared UI
- `frontend/src/store/services/` for RTK Query services
- `frontend/src/store/slices/` for Redux slices
- `frontend/src/lib/` and `frontend/src/types/` for shared types and utilities
- `frontend/src/styles/` for tokens and styling

Rules:

- Default to server components.
- Use `"use client"` only when hooks, browser APIs, or local state are required.
- Keep page files thin and push UI into route-local `_components`.
- Use RTK Query for normal REST flows.
- Use raw fetch plus SSE for streaming recruiter chat.
- Avoid `any`; use precise TypeScript types.

## Design System

Always use tokens from `frontend/src/styles/_variables.scss`.

- Do not hardcode colors, spacing, or radii.
- Reuse `frontend/src/components/common/` before creating new shared components.
- Match the local styling pattern already in use.
- Prefer skeletons for async loading states over spinners in dashboard flows.

Candidate UI should feel calm and guided.
Recruiter UI should feel denser and more operational.

## Product Rules

Status rules must hold:

- Job: `draft -> active -> expired`
- Application: `applied -> screening -> shortlisted -> rejected -> interview_booked -> interview_completed -> offer`

Never break these constraints:

- Enforce transitions in the service layer.
- No duplicate applications.
- Candidates cannot apply to draft or expired jobs.
- Recruiter actions require active company membership.
- Important AI actions require human confirmation.
- Emails require explicit approval.

## Before Mutating Jobs, Applications, Screening, or Shortlisting

Think through all affected layers:

1. PostgreSQL state
2. Qdrant outbox or sync event
3. Redis cache invalidation
4. Frontend RTK Query tag invalidation

## Testing

Before writing backend tests, read:

1. `backend/app/modules/<domain>/models.py`
2. `backend/app/modules/<domain>/schemas.py`
3. `backend/app/shared/enums.py`

Do not assume schema shape from memory.

Backend test commands:

```bash
uv run pytest
uv run pytest backend/tests/integration/ -v
uv run pytest -k "test_name" -v
```

Prefer shared factories/helpers in `backend/tests/integration/helpers.py`.
Mock or skip Redis, Qdrant, and LLM side effects in tests.

## Delivery Checklist

- Backend model/schema/helper/service/router updated if needed
- Alembic migration added if DB changed
- Frontend page, `_components`, and loading state added if needed
- RTK Query or SSE wiring updated
- Loading, optimistic, and error states handled
- Redis and RTK cache invalidation considered
- Qdrant sync considered
- Tests added or updated
- Types kept correct on both sides

## Working Style

- Read surrounding code first.
- Match local patterns.
- Plan the smallest complete solution.
- State assumptions when ambiguity matters.
- Refactor only what you touch unless asked.

## You are not allowed to run any terminal command at all related to frontend and backend, as the venv is made in windows powershell and you are inside WSL so it will corrupt it if you run.
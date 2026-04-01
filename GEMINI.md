# ConvexHire - Agent Context

AI-assisted recruitment platform. Next.js 16 frontend + FastAPI backend.
Core flows depend on status transitions, Qdrant sync, Redis cache, and AI workflows — treat these as first-class concerns.

---

## Stack

| Layer             | Tech                                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Frontend          | Next.js 16 App Router, React 19, TypeScript, RTK Query, raw fetch for SSE/proxy flows, global SCSS, CSS modules, SCSS modules |
| Backend           | FastAPI, async SQLAlchemy, Pydantic v2, Alembic, Postgres, Redis, Qdrant                                                      |
| AI (general)      | Groq (free) — used for chat assistant, job drafting, resume gap analysis                                                      |
| AI (shortlisting) | AWS Bedrock only — shortlisting agent graph exclusively                                                                       |
| Auth              | JWT with refresh — lives in `frontend/src/store/services/baseApi.ts`                                                          |

---

## Dev Commands

```bash
# Backend
cd backend && uv run fastapi dev main.py --port 8000
uv run alembic upgrade head
uv run pytest

# Frontend
cd frontend && pnpm dev
pnpm type-check && pnpm lint && pnpm stylelint
```

---

## Repo Map

```
backend/
  main.py                            # app bootstrap, routers, lifespan
  app/
    core/responses.py                # ResponseBuilder — never bypass
    core/config.py                   # settings via pydantic-settings
    modules/{domain}/
      models.py / schemas.py / helpers.py / service.py / router.py
    agents/shortlisting/             # Bedrock shortlisting agent graph
    modules/job_ai/                  # Groq job drafting
    modules/recruiter_chat/          # Groq chat (SSE)
    modules/resume_gap/              # Groq resume gap
    infrastructures/                 # Redis, Qdrant, S3

frontend/src/
  app/
    (auth)/                          # login, signup, verify-email, reset-password
    (legal)/                         # privacy, terms, cookies
    api/recruiter-chat/sessions/     # Next.js SSE proxy routes
    candidate/
      page.tsx                       # dashboard
      applications/                  # page + _components/ + loading.tsx
      jobs/                          # page + _components/ + [job_id]/
      profile/                       # page + _components/ + loading.tsx
      resume/                        # page + _components/ + [id]/
      layout.tsx
    recruiter/
      page.tsx                       # dashboard
      candidates/                    # page + _components/ + _lib/ + [application_id]/
      chat/                          # page.tsx
      company/settings/              # page + _components/
      interviews/                    # page + _components/ + [id]/ + page.module.css
      jobs/                          # page + _components/ + [id]/edit + [id]/outreach + new/ + manual/
      outreach/                      # page + _components/ + outreach.module.css
      recruiters/                    # page.tsx
      screening/                     # page + _components/ + screening.module.css
      layout.tsx
  components/
    common/                          # AuthGuard, DashboardTabs, StatusPill, Toaster, etc.
    jobs/ApplyModal/                 # multi-step apply flow
    layout/                          # DashNavbar, DashSidebar, MainLayout
    recruiter-chat/                  # ChatAreaWithAgent, ChatSidebar, JobCardGrid, etc.
  hooks/                             # useApplyFlow, useRecruiterChatSessions
  lib/                               # apiError, applicationStatus, statusMetadata, roleRoutes
  providers/                         # StoreProvider, LenisProvider
  store/
    services/                        # RTK Query slices: baseApi, jobsApi, applicationsApi, etc.
    slices/                          # authSlice, resumeSlice, uiSlice
  styles/
    _variables.scss                  # ← all design tokens live here
    _mixins.scss _buttons.scss _typography.scss _reset.scss _layout.scss
    components/                      # per-component global SCSS partials
    pages/                           # per-page global SCSS: _dashboard, _auth, etc.
    main.scss globals.scss
  types/
```

---

## Product Status Rules — Never Break These

### Jobs: `draft → active → expired`

### Applications: `applied → screening → shortlisted → rejected → interview_booked → interview_completed → offer`

- Transitions are constrained in `backend/app/modules/applications/service.py`
- Duplicate applications must stay blocked
- Applying requires an open job + resume owned by the candidate

### Roles: `candidate`, `recruiter`, `recruiter_admin`

- Company access requires active `CompanyMembership`

---

## Backend Rules

**Response contract** — always use `ResponseBuilder`:

```python
ResponseBuilder.success(data)
ResponseBuilder.error(message, status_code)
ResponseBuilder.paginated(items, total, page, size)
```

**Module layout** — every domain module follows:

```
models.py → schemas.py → helpers.py → service.py → router.py
```

- `helpers.py` — pure functions: formatting, validation, computation, data transforms. No DB or HTTP calls.
- `service.py` — orchestration only: calls helpers, DB, cache, Qdrant. Never bloated with inline logic.
- `router.py` — thin: auth wiring + request parsing + ResponseBuilder wrapping. No business logic.
- Rule: if a function in `service.py` has no `await` and no session/cache dependency → move it to `helpers.py`.

**Before any mutation** — think through all 4 layers:

1. Postgres state
2. Qdrant sync / outbox events (jobs, applications, shortlisting)
3. Redis cache invalidation
4. Frontend RTK Query tag invalidation / refetch

**Async** — backend is async end-to-end. No blocking I/O in handlers or services.

**Schema changes** — always use Alembic, never hand-edit DB state.

---

## Frontend Rules

**API layer** — RTK Query is the default for standard API data fetching and mutations. Reuse existing slices and cache tags where they already fit.

- Do not force recruiter chat or streaming flows into RTK Query. Those already use raw `fetch` and Next.js proxy routes for SSE.
- Prefer following the existing pattern in the area you are editing instead of trying to standardize everything in one task.

**Auth** — never bypass the refresh flow in `baseApi.ts`.

**Components** — follow existing App Router server/client split. Only use `"use client"` when hooks, browser APIs, or interactivity require it.

**Imports** — use `@/` aliases where existing code does.

**Recruiter chat** — preserve optimistic updates, pending-action states, and SSE streaming UX.

---

## Styling System

ConvexHire has a shared styling foundation, but the current frontend is mixed rather than fully standardized. Follow the local pattern of the feature you are editing before trying to introduce a new convention.

**Current styling reality:**

- Shared tokens live in `frontend/src/styles/_variables.scss`
- Shared global partials live in `frontend/src/styles/`
- The repo uses all of these today:
  - global SCSS partials imported through `main.scss`
  - CSS modules such as `screening.module.css`, `outreach.module.css`, and `page.module.css`
  - SCSS modules such as `applyModal.module.scss`
  - occasional inline styles for narrowly scoped UI or HTML email preview content

**Token guidance:**

- Prefer existing variables from `_variables.scss` when you are already working in SCSS
- Real token names include values such as `$color-primary`, `$color-text-muted`, `$space-*`, and `$radius-*`
- Do not reference tokens that do not exist
- Avoid introducing unnecessary new raw hex values when an existing token already covers the need

**Import guidance for SCSS files:**

- Match the import style already used in nearby files
- Existing code typically uses `@use 'variables' as *;` or relative imports like `@use '../variables' as *;`
- Do not assume Sass path aliases like `@use '@/styles/variables' as *;` are configured unless you verify them first

**Choosing a style file type:**

- If the surrounding feature already uses `.module.css`, keep using `.module.css`
- If the surrounding feature already uses `.module.scss`, keep using `.module.scss`
- If the feature belongs to the shared global styling system, extend the appropriate partial under `frontend/src/styles/`
- Do not do a style-format migration as part of an unrelated feature

---

## Adding a New Feature — Full Checklist

When asked to "add a page with X feature", always generate both backend and frontend completely.

### Backend

- [ ] `models.py` — SQLAlchemy model with proper relationships and timestamps
- [ ] `schemas.py` — Pydantic request/response schemas
- [ ] `helpers.py` — pure helper functions (formatting, validation, transforms) — no DB/HTTP
- [ ] `service.py` — orchestration: calls helpers + DB + cache. Keep it readable, not bloated
- [ ] `router.py` — thin, uses `ResponseBuilder`, registers in `main.py`
- [ ] Alembic migration if schema changes
- [ ] Check: does this touch jobs/applications/shortlisting? → handle Qdrant + Redis

### Frontend

- [ ] Page file in correct `app/recruiter/` or `app/candidate/` subfolder
- [ ] `loading.tsx` skeleton component in same folder
- [ ] Components co-located in `_components/` subfolder (e.g. `FeatureSkeletons.tsx`)
- [ ] RTK Query slice in `store/services/` or extend existing slice with new endpoints + cache tags when the feature follows the normal API pattern
- [ ] Use the existing styling pattern for that area: shared SCSS partial, `.module.css`, or `.module.scss`
- [ ] Server component by default; `"use client"` only where hooks/browser APIs/interactivity needed
- [ ] Loading + error states handled
- [ ] Preserve the existing visual language of that area unless the task explicitly asks for redesign

---

## AI Provider Rules

| Feature             | Provider         | Notes                                        |
| ------------------- | ---------------- | -------------------------------------------- |
| Recruiter chat      | Groq             | SSE streaming via Next.js proxy              |
| Job drafting        | Groq             | `modules/job_ai/`                            |
| Resume gap analysis | Groq             | `modules/resume_gap/`                        |
| Shortlisting agent  | AWS Bedrock ONLY | `agents/shortlisting/` — do not swap to Groq |

---

## High-Value File Paths by Task

| Task           | Key Files                                                                         |
| -------------- | --------------------------------------------------------------------------------- |
| Jobs           | `backend/app/modules/jobs/` · `frontend/src/store/services/jobsApi.ts`            |
| Applications   | `backend/app/modules/applications/` · `frontend/src/app/candidate/applications/`  |
| Screening      | `backend/app/modules/shortlisting/` · `frontend/src/app/recruiter/screening/`     |
| Recruiter chat | `backend/app/modules/recruiter_chat/` · `frontend/src/components/recruiter-chat/` |
| Resume/Profile | `backend/app/modules/profiles/` · `frontend/src/app/candidate/profile/`           |
| Outreach       | `backend/app/modules/outreach/` · `frontend/src/app/recruiter/outreach/`          |

---

## Working Style

- **Read before writing.** Start from the exact module/component involved.
- **Smallest coherent change** that solves the task — no over-engineering.
- **Match the style** of the file you are editing.
- **Never invent** env vars, scripts, or architectural layers not already in the repo.
- If a change touches status transitions, cache, or Qdrant sync — trace all 4 layers before editing.

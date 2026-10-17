# Working on Rojgar AI

Rules for anyone changing this code, person or AI. Read this, then `docs/RECRUITER_FLOW.md`, `docs/DESIGN_SYSTEM.md` and `DESIGN.md` before writing code. Setup and commands are in `README.md`; current status is in `HANDOVER.md`.

## The product

A business posts a job and gets one apply link to paste into LinkedIn, Facebook, Viber or Merojob. Applicants apply without an account, get an email with a status link, and can sign in with a magic link to see their applications. Every CV is read and ranked with a one-line reason. A person makes every decision with one click, and applicants always hear back.

Roles:
- **Business team:** Owner, Manager, Interviewer.
- **Applicant:** a guest or a magic-link account.
- **Platform admin:** approves businesses, handles reports, records payments.

There is no job board, resume builder or candidate profile. Applicants never pay.

## What the owner wants (non-negotiable)

1. **Think like the end user, not like an AI showcase.** Each screen answers "what needs me now?" with the next action one click away.
2. **Fewest steps for every task.** Count clicks. Prefer inline actions to navigation and smart defaults to questions. Add keyboard shortcuts for frequent work.
3. **No repeated information.**
   - A breadcrumb appears only on nested pages (never "Jobs" above the title "Jobs").
   - No facts line that repeats the filter-chip counts or the tiles right below it.
4. **Plain English, no filler.** It must not read like AI-generated UI. Never add:
   - subtitles under headings, helper paragraphs, or "Manage your X" lines;
   - duplicated titles (a page titled "Notifications" must not contain a card titled "Notifications");
   - text that restates what is visible.
5. **Easy for someone with no expertise.** Every number has a label people understand. No unexplained scores, chips or icons, and no jargon (see the words below).
6. **One consistent design**, built only from the shared library. Reuse; never re-create.
7. **A smaller codebase.** Delete what you replace: old pages, components, hooks, API slices, endpoints, settings and dependencies. Never leave dead code or "just in case" shims.
8. **AI is quiet plumbing.** When AI is working, show it with the AI motion system (below), the way Galaxy AI does.

## Voice and words

- **Human oversight.** Short: **"AI assists. You decide."** Long: "AI helps you review every application, but it never decides alone. Every hiring decision is made by a person."
- **Use:** Business, Team (Owner, Manager, Interviewer), Job, Applicant, "Suggest someone you know", "interview notes" / "How did it go?", "messages to applicants".
- **Stages:** New, Shortlisted, Interview, Offer, Hired, Not selected.
- **Decision buttons:** say "Shortlist" / "Reject" on the business side. Text applicants read stays kind: "Not selected this time".
- **Never in visible text:** candidate, recruiter, organization, rejected (as a stage name), pipeline, AI screening, screening, outreach, evaluation, ATS, scorecard. Identifiers in code may keep old names.
- **Nepali:**
  - Words: व्यवसाय, टिम, जागिर, आवेदक, चिनेको मान्छे सुझाउनुहोस्.
  - Stages: नयाँ · छानिएको · अन्तर्वार्ता · प्रस्ताव · नियुक्त · यसपटक छानिएन.
  - Avoid "सिफारिस": it sounds like nepotism.

## Frontend (`frontend/`)

- **Stack:** Next.js 16 (App Router, Turbopack) and React 19. This Next.js version differs from older ones: check `node_modules/next/dist/docs/` before using an API you're unsure of (see `frontend/AGENTS.md`).
- **Styling:** Tailwind v4 and shadcn/ui (Radix). No SCSS anywhere.
- **Fonts:** Manrope for headings and large numbers (`font-heading`), DM Sans for everything else, Noto Sans Devanagari for Nepali.
- **Colours:** only tokens from `src/app/globals.css` (`primary`, `muted`, `border`, `success`, `warning`, `danger`, `neutral`, `ai-1..4`). Never hex values in components.
- **Brand:** the logo is `components/app/Logo` (`variant="mark" | "full"`). The product name is `BRAND.name` from `lib/brand.ts`.
- **Icons:** only from `@/components/icons` (the Phosphor registry). If you need a new icon, add a semantic name there.
- **Avatars:** `components/app/EntityAvatar`, a photo or generated initials. No avatar services.
- **Components:**
  - `components/ui/*` are the primitives.
  - `components/app/*` are the product components: AppShell, PageContainer, PageHeader, Section, DataTable, StatusPill / ApplicationStatusPill / JobStatusPill, FitPill / ScoreBar, StatStrip, KeyFacts, RoleCard, PersonCell, EmptyState, ErrorState, ConfirmDialog, FileUpload, ShareMenu, BuilderLayout, FilterChips, PublicNav / PublicFooter.
- **AI moments:** use `components/app/Ai`:
  - `AiGlow`: a flowing gradient ring while AI works;
  - `AiSpark`;
  - `AiText`: shimmering status text.
- **Loading:** `Spinner` from `components/app/Ai` is the only spinner. Skeletons come from `components/ui/skeleton`, shaped like the content.
- **Toasts:** `notify` from `lib/notify`. Reversible actions use `notify.undoable(message, { onUndo, onCommit })`.
- **Data:** RTK Query services in `src/store/services` and API clients in `src/lib/api`. Keep the types in sync with the backend schemas; `curl -s localhost:8000/openapi.json` lists every real route.
- **Tailwind scanning:** Tailwind only scans the folders listed with `@source` in `globals.css` (`components/{ui,app,public,me,today,screens}`). Keep route files thin and put markup in those folders. If you add a folder, add an `@source` line and restart `next dev`.
- **ESLint** (`eslint.config.mjs`) forbids:
  - raw `<button> <input> <select> <textarea> <table> <dialog>` outside `components/ui`;
  - Phosphor imports outside `components/icons.ts`;
  - any `.scss` / `.sass` import.
- **Checks** (from `frontend/`): `npm run type-check`, `npm run lint`, `npm run format:check`, `npm run build`.

## Backend (`backend/`)

- **Stack:** FastAPI, async SQLAlchemy and Postgres, Redis, and Qdrant (CV search). Each module has a router, service, models and schemas.
- **Config:**
  - `app/core/config.py` holds only what differs between environments (URLs, keys, switches).
  - Product constants (limits, sizes, durations) go in `app/core/constants.py` or next to the code that uses them.
  - When you add or remove a setting, update `.env.example` and `.github/workflows/ci.yml`.
- **Async rule:**
  - Use `async def` only when everything inside is awaited.
  - Sync libraries (Cloudinary SDK, pypdf, fastembed, sync SDKs) go in a plain `def` endpoint (it runs in the threadpool) or in `await asyncio.to_thread(...)`.
  - No `time.sleep` in async code.
  - No slow external calls (AI, storage, email) while holding a DB transaction: upload or call first, then write.
- **People decide:** AI never moves an applicant's stage by itself. Every decision is recorded as an Event and goes through the undo window.
- **AI calls:** only through LangChain agents in `app/infrastructures/ai/llm.py` (`structured_agent`, `generate_structured`, `run_agent`). No provider SDK calls anywhere else.
  - Answers are structured output (a Pydantic schema). Describe each field with `Field(description=...)` on the schema, not in the prompt.
  - Every agent gets retries, the Gemini fallback, the quota guard (`quota.py`: free-tier limits per model, cooldown after a 429) and a model-call cap.
  - Guardrails live in `app/infrastructures/ai/guards.py` (injection check, PII redaction, history trim). Output checks (quotes, salary numbers) are `after_agent` middleware.
  - Keep long text inside a token budget (see `app/modules/review/excerpt.py`), and keep `max_tokens` small: Groq counts it against tokens per minute.
  - Rate limits end in a friendly message, never a raw error; background reviews wait for quota instead of failing.
- **Files:** use `app/infrastructures/storage` only. CVs and business documents are private; logos and avatars are public. Locally, files go to disk.
- **SMS** is off (`SMS_ENABLED=false`): applicants hear back by email. Keep features working without it.
- **Alembic:**
  - Give new migrations a random-looking unique id (`uuid4().hex[:12]`), never a sequential one.
  - There must always be exactly one head (`uv run alembic heads`).
  - The Docker entrypoint runs `alembic upgrade head` on every start.
- **Checks** (from `backend/`):
  - `REDIS_ENABLED=true uv run pytest -p no:cacheprovider -o addopts="" -q`
  - `uvx ruff@0.14.10 check`
  - `uvx ruff@0.14.10 format --check`

## Safety

- **Local only.**
  - `backend/.env` and `frontend/.env.local` point at local Postgres :5433, Qdrant :6335 and Redis :6380.
  - Never seed, reset or test against production.
  - Seed scripts refuse non-local targets; don't remove that guard.
- **Secrets:** never commit, print or log them. `.env` files stay gitignored.
- **Git:**
  - Commit small, working steps with clear messages, and only the files you changed (`git commit -m "..." -- <paths>`).
  - Don't push, force-push or rewrite history unless the owner asks.
  - A push to `main` deploys the frontend on Vercel.

## Verifying UI work

Check it in a real browser (Playwright at 1440 and 390 px wide) and look at the screenshots as the end user would. Fix anything confusing before you report back.

## Reporting back

List:
- your commits;
- what's done and what isn't;
- API contracts you added or changed;
- files deleted;
- the check results;
- screenshot paths.

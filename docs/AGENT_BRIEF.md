# Brief for anyone building Rojgar AI

Read this, then `docs/RECRUITER_FLOW.md` and `docs/DESIGN_SYSTEM.md`, before writing code.

## The product
Rojgar AI is recruiter-first. A company posts a job and gets one apply link to paste into LinkedIn, Facebook or Merojob. Candidates apply without an account, get an email with a status link, and can sign in with a magic link to see their applications. Every CV is read and ranked with a one-line reason. A person makes every decision with one click, and candidates always hear back.

Roles: recruiter, company admin (recruiter + team/company settings/audit), candidate (guest or magic-link account). No job board for seekers.

## What the owner wants (non-negotiable)
1. Think like the end user, not like an AI showcase. Each screen answers "what needs me now?" with the next action one click away.
2. Fewest steps for every task. Count clicks. Inline actions over navigation, smart defaults over questions, keyboard for frequent work.
3. Plain English. No filler: no subtitle under headings, no helper paragraphs, no "Manage your X" lines, no duplicated titles (a page titled "Notifications" must not contain a card titled "Notifications"), no text that restates what is visible. It must not read like AI-generated UI.
4. Easy for someone with no expertise. Every number has a label people understand; no unexplained scores, chips or icons; no jargon ("pipeline", "AI screening", "evaluation"). Use the words in RECRUITER_FLOW.md section 5.
5. One consistent design across every page, built only from the shared library. Reuse, never re-create.
6. Smaller codebase. Delete what you replace: old pages, components, SCSS, hooks, API slices, endpoints. Never leave dead code.
7. AI is quiet plumbing, but when AI is working, show it with the AI motion system (below), the way Galaxy AI does.

## Voice and key phrases
- Human oversight, short: **"AI assists. You decide."** Long: "AI helps you review every application, but it never decides alone. Every hiring decision is made by a person." Never "A person makes this decision" or "A recruiter makes every final decision".
- Words: Business, Team (Owner, Manager, Interviewer), Job, Applicant, "Suggest someone you know". Stages: New, Shortlisted, Interview, Offer, Hired, Not selected. Never "candidate", "recruiter", "organization", "rejected", "pipeline", "AI screening".
- Nepali equivalents: व्यवसाय, टिम, जागिर, आवेदक, चिनेको मान्छे सुझाउनुहोस्; stages नयाँ · छानिएको · अन्तर्वार्ता · प्रस्ताव · नियुक्त · यसपटक छानिएन. Avoid "सिफारिस" (sounds like nepotism).

## Design system (frontend)
- Next.js app, Tailwind v4 + shadcn/ui (Radix). Fonts: Manrope for headings and large numbers (`font-heading`), DM Sans for everything else.
- Colors only from tokens in `src/app/globals.css` (`primary`, `muted`, `border`, `success/warning/danger/neutral`, `ai-1..4`). Never hex values in components.
- Logo: `components/app/Logo` (`variant="mark" | "full"`). Product name: `BRAND.name` from `lib/brand.ts`.
- Icons: only from `@/components/icons` (Phosphor registry). Add a semantic name there if you need a new one.
- Components: `components/ui/*` primitives, `components/app/*` product components (AppShell/RecruiterShell, PageContainer, PageHeader, Section, DataTable, StatusPill/ApplicationStatusPill/JobStatusPill, FitPill/ScoreBar, StatStrip, KeyFacts, RoleCard, PersonCell, EmptyState, ErrorState, ConfirmDialog, FileUpload, ShareMenu, BuilderLayout, FilterChips, PublicNav/PublicFooter).
- AI moments: `components/app/Ai` — `AiGlow` (flowing gradient ring while AI works), `AiSpark`, `AiText` (shimmer status text). Loading: `Spinner` from the same file is the only spinner. Skeletons: `components/ui/skeleton`, shaped like the content.
- Toasts: `notify` from `lib/notify`. Reversible actions use `notify.undoable(message, { onUndo, onCommit })`.
- Tailwind only scans `src/components/{ui,app,public,me,today,screens}`. Keep route files thin; put markup there. If you add a folder: add an `@source` line in globals.css, add it to ESLint `NEW_CODE`, and restart `next dev`.
- ESLint forbids raw `<button> <input> <select> <textarea> <table> <dialog>` outside `components/ui`, direct icon-library imports, legacy chrome imports and `.scss` in new code. `frontend/eslint.legacy.mjs` lists legacy exemptions; it may only shrink (remove a route when you migrate it).
- Prettier and ESLint run from `frontend/`. Gates: `npx tsc --noEmit`, `npx -y pnpm@10 lint`, `npx -y pnpm@10 build`.

## Backend
- FastAPI + async SQLAlchemy + Postgres, Redis, Qdrant. Tests: `cd backend && REDIS_ENABLED=true uv run pytest -p no:cacheprovider -o addopts="" -q`. Lint: `uvx ruff@0.14.10 check` and `format`.
- Async rule: `async def` only when everything inside is awaited. Sync libraries (boto3, sklearn, pypdf, weasyprint, sync SDKs) → plain `def` endpoint (threadpool) or `await asyncio.to_thread(...)`. No `time.sleep` in async code. No slow external calls while holding a DB transaction.
- A person makes every hiring decision; AI never moves a candidate's stage by itself.
- Alembic: give new migrations a random-looking unique id (`uuid4().hex[:12]`), never the sequential pattern.
- Local only. `.env` points at local Postgres :5433, Qdrant :6335, Redis :6380. Never touch production. Don't push.

## Working rules
- Work only in your own git worktree and branch. Commit small, working steps with clear messages.
- Stay inside your ownership list. If you need a change elsewhere, write it in your final report.
- Verify in a real browser (Playwright, 1440 and 390 wide) for UI work; look at your screenshots as the end user and fix what's confusing before you report.
- Final report: commits, what's done vs not, API contracts you added or changed, files deleted, gates results, screenshot paths.

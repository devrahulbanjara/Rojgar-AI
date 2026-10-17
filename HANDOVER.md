# Rojgar AI — handover (2026-10-17)

Everything below is what was asked for in the revamp session, what is done, what is in flight, and exactly how to finish it.

## Where things are

- **Main code:** `~/Documents/Rojgar-AI`, branch `production-hardening`, pushed to `github.com/devrahulbanjara/Rojgar-AI`. `main` is untouched (it is probably what Vercel deploys).
- **Unfinished work** sits on 4 branches, each with its own folder next to the main one. The agents were told to commit their WIP before stopping.

| Folder / branch | What it is | State |
|---|---|---|
| `ConvexHire-wt-b1` / `wave/b1` | Data model v2: stages (new, shortlisted, interview, offer, hired, rejected, withdrawn), Review table with must-have checks + verified quotes, Event timeline, referrers ("suggest someone"), sector templates, quick add, CSV export, protected-ground filter, cheap triage review, non-tech Nepal seed data | **MERGED** into `production-hardening` (commit `c7f9f77e`, alembic chain `e8dd80fa`, adapter switch `92292149`, bugfix `b3fed4a0`). |
| `ConvexHire-wt-b4` / `wave/b4` | People without global roles; business roles Owner / Manager / Interviewer; phone OTP sign-up; create business → pending → platform approval; invite-only teams; `/admin` panel (approvals, businesses, reports, payments) | **MERGED** into `production-hardening` (commit `d2d4677d`, alembic chain `448c86788f39` chained to `2017037b521a`, all 8 conflicts resolved). |
| `ConvexHire-wt-f4` / `wave/f4` | Public side: Nepali/English toggle, phone-first apply, photo CVs, "suggest someone" page, QR poster, careers page, landing + pricing for small businesses, `/me/applications` shell fix | **MERGED** into `production-hardening` (commit `cb674dc5`, alembic chain `e1267236faf8` chained to `448c86788f39`, all 7 conflicts resolved). |
| `ConvexHire-wt-f5` / `wave/f5` | Calmer applicant panel: icon contact row (Call / Viber / WhatsApp / Email), collapsed CV, accordion must-have checks, "Ask about <name>" button | In progress (next to merge) |

To see each branch: `git -C ~/Documents/ConvexHire-wt-b1 log --oneline production-hardening..HEAD` (same for b4, f4, f5).

## Session Update — Multi-Model Handover (2026-10-17 17:30)

### What Claude Opus 4.6 (Thinking) did:
1. **Handover analysis & strategy:** Analyzed repo status, commit logs across `production-hardening` and the 4 branches, merge base divergences, and confirmed merge order.
2. **Initiated `wave/b1` merge:** Executed `git merge --no-commit --no-ff wave/b1` into `production-hardening`.
3. **Resolved 14 modify/delete conflicts:** Cleanly preserved deletions of deprecated modules (`recruiter_chat`, `job_ai`, `interviews/webhook`, `interviews/evaluation_schemas`, `test_cal_webhook`, `outreach`) as mandated by the handover rules.
4. **Architectural analysis:** Explained the native interview scheduling system that replaced Cal.com (`scheduling.py`, `service.py`, `stage.py`, `notify.py`, `reminders.py`, Jitsi Meet, Scorecards).
5. **Conflict subagents:** Defined and dispatched 4 specialized subagents to resolve remaining content conflicts across 12 files before individual Opus API quota limits were reached.

### What Gemini did:
1. **Clean subagent lifecycle:** Terminated all remaining/exhausted subagents to cleanly release workspace locks and resources.
2. **Resolved all remaining `wave/b1` content conflicts (12 files):**
   - `backend/alembic/env.py`: Clean model registration imports.
   - `backend/tests/integration/test_recruiter_home.py`: Merged enum imports (`ApplicationStage`, `ApplicationStatus`, etc.).
   - `backend/main.py`: Preserved new routers (`recruiter_router`, `job_templates_router`) while keeping deleted modules removed.
   - `backend/app/modules/dashboards/home.py`: Switched query to `Application.stage == ApplicationStage.interview` and `~_interview_done()`.
   - `backend/scripts/seed_e2e.py`: Switched to `import app.core.model_registry`.
   - `backend/app/modules/jobs/service.py`: Resolved `JobStatus.open`, `closes_at`, and entitlement checks alongside v2 criteria/question processing.
   - `DOCUMENTATION.md`: Kept native scheduling details, v2 pipeline diagram, and cleaned deprecated service mentions.
   - `backend/app/modules/applications/schemas.py`: Retained v2 schema fields (`fit`, `summary`, `flagged`, `source`) and purged legacy v1 structures.
   - `backend/app/modules/interviews/service.py`: Kept native scheduling, removed residual Cal.com logic (`cal_booking_uid`, old complete handlers), and wired `stage` into `CandidateInterviewView`.
   - `backend/app/modules/applications/service.py`: Stripped obsolete v1 recruiter endpoints (superseded by `pipeline.py` & `recruiter_router.py`).
   - `backend/seed_data.py`: Integrated non-tech Nepal companies, v2 reviews/events, Jitsi interview scheduling, and pruned legacy outreach/recording mocks.
   - Committed merge: `c7f9f77e`.
3. **Alembic migration chain resolution (Handover step 4):**
   - Pointed `backend/alembic/versions/2017037b521a_data_model_v2.py` `down_revision` to `668b934a505f`.
   - Verified single migration head: `2017037b521a (head)` (commit `e8dd80fa`).
4. **Adapter switches to data model v2 (Handover step 6):**
   - `backend/app/modules/interviews/stage.py`: Rewrote mappings to use `ApplicationStage` and `ApplicationEvent` timeline.
   - `backend/app/modules/dashboards/insights.py`: Updated `STATUS_RANK`, `WAITING_STATUSES`, and query filters to `ApplicationStage`.
   - `backend/app/modules/assistant/context.py`: Updated `load_candidate_context` to read `Review` (fit, summary, checks with quotes) and `ApplicationStage`.
   - `frontend/src/lib/api/recruiter.ts`: Enabled `CAPABILITIES` (`notes`, `markHired`, `withdraw`, `questionTypes`, `jobCategory`, `addCandidate`) and routed candidate endpoints to `/recruiter/v2`.
   - Committed adapter updates: `92292149`.
5. **Runtime bugfix:**
   - Fixed missing positional `scope` argument in `_per_ip` rate-limiter on recommend endpoint (`backend/app/modules/public/router.py`): commit `b3fed4a0`.
6. **Executed and completed `wave/b4` merge (commit `d2d4677d`):**
   - Resolved 8 conflicted files: `applications/router.py`, `dashboards/home.py`, `dashboards/schemas.py`, `dashboards/service.py`, `public/service.py`, `seed_data.py`, `helpers.py`, `test_applications.py`.
   - Chained migration `448c86788f39` -> `2017037b521a`. Verified single head: `448c86788f39 (head)`.
7. **Executed and completed `wave/f4` merge (commit `cb674dc5`):**
   - Resolved 7 conflicted files:
     - `public/notify.py`: Wired `notify_applicant` to `app.infrastructures.sms.service.send_sms`.
     - `public/router.py`: Reconciled phone-first guest apply, deduplicated `/recommend` endpoint, preserved `CurrentUser`.
     - `public/schemas.py`: Reconciled `Stage` literal, `InterviewInfo`, `PublicCategory`, and `RecommendRequest`/`RecommendSent`.
     - `public/service.py`: Reconciled `_STAGE` mapping, `JobSuggestion` with `JobReferrer`, status link via SMS/email, and `list_my_applications`.
     - `test_public_apply.py`: Reconciled v2 pipeline assertion and preserved `TestSuggestSomeone`.
     - `layout.tsx`: Applied `LocaleProvider`, `getLocale`, Devanagari font variable, and `lang={locale}`.
     - `AccountMenu.tsx`: Preserved session role definitions with optional `to` route.
   - Chained migration `e1267236faf8` -> `448c86788f39`. Verified single head: `e1267236faf8 (head)`.

### Next steps for immediate continuation:
1. Merge `wave/f5`: `git merge --no-ff wave/f5`.
   - Fix candidate panel imports (`CallButtons` -> `ContactButtons`).
2. Run gates:
   - Backend: `cd backend && uv run pytest -p no:cacheprovider -o addopts="" -q`
   - Frontend: `cd frontend && npx tsc --noEmit && npx -y pnpm@10 build`
3. Merge `production-hardening` into `main`: `git checkout main && git merge production-hardening`.

## How to merge the rest (in this order)

1. `wave/b1`: **DONE & MERGED** (commit `c7f9f77e`).
2. Next is `wave/b4`, then `wave/f4`, `wave/f5`.
3. For each: `cd ~/Documents/Rojgar-AI && git merge --no-ff wave/<name>`. Resolve conflicts by keeping both sides' intent. Deleted modules stay deleted (`recruiter_chat`, `job_ai`, recordings, Cal.com, resume gap).
4. **Alembic:** after every merge run `cd backend && uv run alembic heads`. If there are two heads, set the newer branch's first migration's `down_revision` to the other head (that's how the earlier merges were done), then `uv run alembic upgrade head`.
5. Run the gates (see Commands). Then push: `git push origin production-hardening`.
6. After b1 merges, switch the adapters to the new API in one place each:
   - `frontend/src/lib/api/recruiter.ts`: `CAPABILITIES` lists features waiting on b1 (notes, mark hired, withdraw, add candidate, referrers, templates, must-have checks).
   - `backend/app/modules/assistant/context.py`: reads application status/score/strengths. Switch to `stage` / `Review.checks`; the docstring lists every field.
   - `backend/app/modules/interviews/stage.py`: maps interview events to stages; switch to `stage` + Event.
   - `backend/app/modules/dashboards/insights.py`: `_status_rank`, `_event_ranks`, `_first_decisions`, `WAITING_STATUSES`.
7. Reseed the local demo: `cd backend && uv run python seed_data.py && uv run python scripts/seed_demo_refresh.py` (local-only; both refuse to touch production).

## Small changes the owner asked for that are not done yet

- **"Not now" → "Reject"** on the employer side: button label, keyboard R, bulk bar, stage chip "Rejected". Applicant-facing emails and SMS stay kind ("Not selected this time"). Files:
  - `frontend/src/lib/api/recruiter.ts` (lines with `'Not now'`)
  - `components/screens/job/useDecisions.ts`, `JobPage.tsx`, `DecisionButtons.tsx`
  - `components/public/landing/ApplicantsPreview.tsx`
  - The `wave/f5` branch also edits the job screens, so do this after merging f5.
- **Jargon sweep** across UI, emails, SMS and backend notification titles. Banned words: outreach, scorecard, candidate, recruiter, organization, pipeline, AI screening, evaluation, ATS. Use the words in `docs/AGENT_BRIEF.md`. Find them with: `grep -rniE "outreach|scorecard|candidate|recruiter|pipeline|screening|evaluation" frontend/src backend/app --include=*.tsx --include=*.py` — check only user-visible strings, not identifiers.
- **Repetition audit** on every page: no one-crumb breadcrumbs, no facts line repeating chips/tiles, no subtitle repeating the title, no card titled like its page.
- **Persona audit after the fixes:** `cd backend && uv run python -m simulation fairness` and `... redteam`, then `load` against your own backend on port 8002. Compare with the baseline (before) numbers below.

## Bigger items still to do

1. **Dead-code sweep.** Run `npx knip` in `frontend/` and `uvx vulture app --min-confidence 80` in `backend/`. Delete what's truly unused. Remove the unused Python deps `langgraph-checkpoint-postgres`, `psycopg[binary]`, and `fastapi-limiter` if nothing imports it. Shrink `frontend/eslint.legacy.mjs` to empty by migrating the last legacy pages (legal pages, profile/settings partials) and delete their SCSS. Size now: 677 files, 8.5 MB (started at 956 files, 113 MB).
2. **Docs.** `DESIGN.md` is done (Google design.md format; `npx @google/design.md@0.4.0 lint DESIGN.md` → 0 warnings). Still to write:
   - `README.md` (what it is, local setup, commands, architecture)
   - `AGENTS.md` (merge `docs/AGENT_BRIEF.md` into it: rules, voice, design system, async rule, commands)
   - `CLAUDE.md` containing just `See AGENTS.md`
   - Then delete `docs/AGENT_BRIEF.md`, `DOCUMENTATION.md`, `backend/README.md` and `frontend/AGENTS.md`. Fold `docs/RECRUITER_FLOW.md` and `docs/DESIGN_SYSTEM.md` into `AGENTS.md`/`DESIGN.md`, or keep them as the only two docs.
3. **Payments.** eSewa / Khalti / Fonepay plus an IRD-format VAT bill (13%). Entitlements (plans, job passes, quotas) already exist; payments are recorded manually from `/admin` for now.
4. **SMS in production:** set `SMS_PROVIDER=sparrow` plus the Sparrow token and sender. Locally SMS is only logged.
5. **Pricing margin.** Prices give about NPR 8–10 revenue per reviewed applicant; worst-case cost is NPR 11–12. Make the triage review (b1) the default and cap SMS at 3 per applicant, so the average cost stays under about NPR 6.
6. **Council report.** The critique as an expert debate, with evidence (findings are below). Publish it as a page once the merges are done.
7. **Talk to 20 employers** (5 sectors × 4) before launch. Applicants per post, who decides and what they'd pay are not public anywhere.

## Owner actions (only you can do these)

- **Rotate every secret** pasted in chat: AWS (both keys), Supabase DB password, Gmail app password, Google OAuth secret, Groq, Gemini, Tavily, LlamaCloud, LangSmith, Upstash Redis, Qdrant.
- **Dead keys:** the Bedrock shortlisting key is invalid (`InvalidClientTokenId`), and the LangSmith key returns 403.
- **Groq:** the free tier (8k tokens/min, daily cap) is too small; AI features fail under light load. Move to Groq Dev tier or another provider.
- **Vercel:** set `NEXT_PUBLIC_BACKEND_URL` (the deployed site called `http://localhost:8000`) and add the DNS record for the custom domain.
- **Production env:**
  - `TRUSTED_PROXY_HOPS=1` (behind Render)
  - `ENVIRONMENT=prod`
  - `STORAGE_BACKEND` empty (prod uses S3)
  - the new scheduling, SMS and plan settings in `backend/.env.example`
  - `CAL_WEBHOOK_SECRET` is no longer needed
- **Git history:** `backend/credentials.json` (seeded accounts, password `Password@123`) is in old history. Purge it with `git filter-repo --path backend/credentials.json --invert-paths`, then force-push. This rewrites history, so do it consciously. Also delete or re-password any seeded accounts that exist in production.
- **Before merging to `main`:** run migrations against production carefully. Two of them abort if emails or company names differ only by case.

## Local setup (this machine)

- No Docker access (user not in the `docker` group), so the session ran portable services. They were temporary and live in the session scratchpad, so they'll be gone. Alternatives:
  - add yourself to the docker group and run `docker compose up -d` (test stack on 5433 / 6335 / 6380); or
  - install Postgres 16 and Redis locally; Qdrant has a single binary on GitHub releases.
- `backend/.env` must point at **local** stores (`DB_HOST=localhost`, `DB_PORT=5433`, `QDRANT_URL=http://localhost:6335`, `REDIS_ENABLED=false` or local Redis). Never use the production Supabase/Qdrant/Upstash for seeding or tests.
- Run:
  - backend: `cd backend && uv run alembic upgrade head && uv run uvicorn main:app --port 8000 --reload --reload-dir app`
  - frontend: `cd frontend && npx -y pnpm@10 dev` (port 3000)
- Logins (local seed, password `Password@123`):
  - business member: `priya.maharjan@f1soft.com`
  - business owner: `bikash.shrestha@f1soft.com`
  - applicant: `aashish.basnet@gmail.com`
  - after b4 merges, platform admin: `admin@rojgarai.app`
- If Today looks empty on a later day: `cd backend && uv run python scripts/seed_demo_refresh.py`.

## Commands (gates before every push)

- Backend: `cd backend && REDIS_ENABLED=true uv run pytest -p no:cacheprovider -o addopts="" -q` (217 passing at handover), `uvx ruff@0.14.10 check` and `uvx ruff@0.14.10 format`.
- Frontend: `cd frontend && npx tsc --noEmit && npx -y pnpm@10 lint && npx -y pnpm@10 build`.
- Design file: `npx @google/design.md@0.4.0 lint DESIGN.md`.

## Product decisions made in this session (keep them)

- **Who it's for:** small and medium NON-tech businesses in Nepal (hotels, clinics, schools, shops, banks, factories), often with no online presence, hiring through people they know. All job types, not just IT.
- **Hybrid model:** one apply link per job (LinkedIn "apply on external site", Facebook, Viber, Merojob, QR poster). Applicants need no account (CV optional, phone-first) and can sign in with a magic link to see their applications. No job board, no resume builder, no gap analysis, no candidate pricing. Job seekers never pay.
- **"AI assists. You decide."** AI reviews against the job's must-haves with quotes; it never rejects or moves anyone. No AI interview scoring and no recordings (Whisper removed). Interviews are judged by people ("How did it go?" notes).
- **Words:** Business, Team (Owner, Manager, Interviewer), Job, Applicant, "Suggest someone you know". Nepali equivalents are in `docs/AGENT_BRIEF.md`. Avoid "सिफारिस".
- **Pricing (+13% VAT):** first job free · Job Pass NPR 999 per job · Job Pass Plus NPR 2,499 · Team NPR 3,499/month · Business NPR 9,999/month · volume hiring NPR 8 per review · top-up NPR 1,000 per 100 reviews. Later: paid "Boost" (SMS a job to matched job seekers) as the growth engine.
- **Design:**
  - Manrope (headings and numbers) + DM Sans (text) + Noto Sans Devanagari fallback.
  - Indigo `#4338CA` on cool neutrals.
  - The AI gradient (indigo → blue → cyan → teal) only while AI works: glow, sparkle, shimmer, asymmetric spinner.
  - Phosphor icons through `src/components/icons.ts` only.
  - shadcn/ui + Tailwind v4.
  - Every UI piece is built once, and lint enforces it.
  - No filler text, no repetition, fewest steps.
  - Logo: `components/app/Logo` (`mark` / `full`) and `public/brand/*.svg`.

## Evidence for the council report

- **Persona audit, baseline (before fixes).** Raw reports are not in the repo; rerun the harness to regenerate them.
  - An ML score cliff at similarity 0.70: changing only the college name flipped 19 → 78.
  - Blank years of experience flipped 75% of shortlisted applicants to rejected.
  - Senior (20+ years) applicants lost about 15 points.
  - Zero-width hidden text passed the guardrail.
  - Guardrail failed open on Groq 429.
  - 33% errors at 200 users (5-connection DB pool).
  - The login rate limit was one global bucket.
- **Chatbot, before:**
  - 78 s, then a raw 429 error.
  - "Below 50" read as age.
  - Listed all interviews as "today".
  - Hallucinated a rejection reason.
  - "What should I do today?" → "unprofessional request".
  - Rebuilt: 6,076 → 1,342 lines, about 1 s per answer, quotes verified in code.
- **Security fixes merged:**
  - Unauthenticated Cal webhook.
  - Email-verification bypass for business accounts.
  - Profile IDOR.
  - Audit log leaking IPs.
  - Deleted accounts could still log in.
  - The model file was missing from the Docker image, so production likely shortlisted everyone.
  - OAuth token in the URL.
  - Next.js critical CVEs.
  - 13 MB background images.
  - Fabricated "12,000+ job seekers" stats and fake partner logos.
  - CI that skipped all tests.
- **Market:**
  - 73–75% of Nepali establishments have 1–2 people.
  - Referrals ("afno manchhe") dominate.
  - Merojob, Kumari Job, RigoJobs and Fusemachines all launched AI screening in 2024–26, so differentiate on all job types, phone/SMS, per-job price, evidence quotes and any channel.
  - Facebook was blocked in Sept 2025, so don't depend on one channel.
  - Sources are in the research notes (Kathmandu Post, DataReportal 2026, NEC2018, Nepal Labour Act s.6, Privacy Act 2075).

## Agent status at stop (exact)

- **wave/b4 (HEAD 4da446e3):**
  - Backend done, 247 tests passing: migration 448c86788f39 (roles), OTP, businesses, invites, `/admin` API, reports, verified flag, admin seed + `scripts/make_platform_admin.py`.
  - Frontend about half done; **tsc fails**. Next:
    - LoginForm/SignupForm with phone code first; route with `homePathFor`.
    - Rebuild TeamView (members, roles, remove with undo, invite links).
    - AuditView should use `useGetTeamQuery(active_business.business_id)`.
    - Remove join requests from TodayView and `dashboardApi`.
    - ProfileSettings: `user.email ?? ''`.
    - New pages `/start`, `/invite/[token]`, `/admin` (Approvals, Businesses, Reports, Payments).
    - Verified badge + "Report this job" on the public job page; add `/admin` and `/start` to `proxy.ts`.
    - Gates.
- **wave/f4 (HEAD a83def6a):**
  - Done: i18n EN/नेपाली (`lib/i18n`), `/me` frame fix, landing rewrite (Unsplash-licence portraits), phone-first apply with photo CVs, suggest-someone, A4 QR poster, careers, status. Backend 218 passing; tsc and lint pass; **`next build` not run**.
  - Before merging:
    - Phone-only apply needs b1's nullable `users.email`.
    - `job_suggestions` overlaps b1's `JobReferrer` — keep one.
    - Switch `notify_applicant` to b2's `send_sms`.
    - Move the public module from `status` to b1's `stage`/Review.
    - The SMS status link needs a short link (the current token takes 3+ SMS).
- **wave/f5 (HEAD 6663ec04, WIP, does not build):**
  - Done: Viber/WhatsApp marks in `icons.ts`, `Hint` tooltip, `ContactButtons`, collapsible `AskBox`.
  - Next:
    - Finish the `CandidatePanel` rewrite (fixes the broken `CallButtons` import): header + facts line, must-have accordion, CV summary + "Show CV", skills +N, answers 2 + "Show all", Activity footer, sticky mobile bar.
    - `CandidateCard` one-line rows; move the keyboard hint into a tooltip.
    - Gates and screenshots (`scratchpad/pw/shot.cjs` is temporary — write a new one).
- **wave/b1 (HEAD d2437e28, about 30 commits, stopped before its final report):**
  - Done, with tests: data model v2 (migration 2017037b521a with up/down tests), rolling review (verified quotes, deterministic fit, triage, retries), the employer v2 API (pipeline, panel, decide/undo/bulk, notes, flags, quick add, referrers, export, recommend), job v2 fields, protected-ground warnings, templates, and v2 seeds (non-tech employers, Nepali answers, phone-only applicants, referrers).
  - Last commit is WIP: the simulation update; red-team not run.
  - **Warning:** b1 branched before the b2/b3 merges. It edits `recruiter_chat`/`job_ai` (deleted on main — keep them deleted) and touches interviews, dashboards and public. Expect conflicts in `main.py`, `seed_data.py`, `interviews/*`, `dashboards/*`, `public/*` and the alembic chain. Merge b1 first, run the full suite, and fix forward.

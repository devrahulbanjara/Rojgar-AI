# Rojgar AI

Recruiter-first hiring for every kind of job in Nepal (shop, hotel, clinic, school, bank, factory, transport, office, IT). Single source of truth for product behaviour, AI internals, security guardrails, and data flow.

---

## 1. Users & Access

| Role | Description | Approval | Capabilities |
|------|-------------|----------|--------------|
| **Candidate** | Job seekers | Instant | Apply from a shared job link (no account needed), track status, optional passwordless account |
| **Recruiter** | Company hiring team | Admin approval (pending → active) | Jobs, candidates, decisions (with automatic emails), interviews, AI chat |
| **Recruiter Admin** | Founder / lead | Instant | All recruiter capabilities + company registration, team management, settings, logo |

**Auth.** Email + password with 6-digit OTP verification, or Google SSO (instant verified). Forgot-password via one-time reset link emailed to user. Argon2 password hashing. JWT access tokens (15 min) + httpOnly refresh cookies (7 days). `DELETE /auth/me` soft-deletes (`is_deleted`, `deleted_at`) and revokes all refresh tokens; deleted users blocked at login.

**Endpoints (auth).** `signup`, `verify-email`, `resend-otp`, `login`, `refresh`, `logout`, `forgot-password`, `reset-password`, `me`, `update-me`, `change-password`, `delete-account`, `google/login`, `google/callback`.

---

## 2. Candidate Experience

**Profile** — full name, location, phone, headline, summary, work experience (company, role, dates, description), education (institution, degree, dates), skills, years of experience, LinkedIn / GitHub / portfolio links, avatar (S3 upload). Profile-completion indicator nudges fill. **Open to Work** toggle.

**Onboarding.** Candidate picks **target roles** that shape job feed relevance. Recruiter searches company + submits join request — sits in `pending` until admin approves.

**AI Resume Import.** Upload any PDF; LlamaCloud structured-extractor + Groq normaliser fill every profile field. Candidate reviews + confirms before save. The same parse creates a reusable resume object.

**Resume Builder.** Multiple named resumes (e.g. "Backend focused", "Full stack general"). Edit summary, work, education, skills, links. Live preview matches recruiter view. Download as PDF (WeasyPrint + Jinja2 template). Delete unused resumes.

**Find Jobs.** `/jobs` lists active jobs. Search by keyword, filter by location type (remote/onsite/hybrid) + salary range. **Hybrid semantic search** combines Qdrant dense vectors (Gemini 3072-d embeddings) with BM25 sparse retrieval — natural-language queries like "Python backend" match by meaning, not keyword. Side-panel preview (full JD, responsibilities, requirements, benefits, salary, expiry) without leaving the list.

**Apply Flow.**
1. Open the job's public link (`/jobs/{slug}`, optionally `?ref={token}` from a person's referral link; `src=` marks LinkedIn/Facebook/Merojob/Viber/QR)
2. Name + phone **or** email (phone stored in E.164, Nepal +977 default, Devanagari digits accepted); CV is optional
3. Answer the job's questions (short text or yes/no; English or Nepali), give consent, submit — no account needed
4. With an email: a confirmation carries a private status link (withdraw + delete data from there). Phone-only: SMS is B2's (stub logs for now)
5. Optional: "Continue with email" magic link to see every application in one list

**Recommend someone.** `POST /public/jobs/{slug}/recommend` — anyone can vouch for a person (name + phone, optional note). Creates an application (stage new, source referral, referrer linked); rate-limited per IP and per job.

Constraints: one application per person per job; draft and closed jobs do not accept applications.

**Dashboard.** Counts per stage.
**Applications page.** Stage (New, Shortlisted, Interview, Offer, Hired, Not selected, Withdrawn) and timeline. Candidates never see AI review output.
**Offer respond.** `POST /applications/{id}/offer/respond`: accept → stage hired; decline → withdrawn (event "declined offer").

---

## 3. Recruiter Experience

**Dashboard.** Applications to review, flagged CVs, upcoming interviews, jobs closing soon, pending team join requests (admin only).

**Create Jobs.** One page: title, location, work type, category (Banking & Finance, Healthcare, Education, Hospitality & Tourism, Sales & Retail, Manufacturing, Logistics & Driving, IT & Software, NGO/INGO, Government & Public, Office & Admin, Construction & Engineering, Other), employment type, monthly salary (NPR), one Markdown **description**, **must-haves** and **nice-to-haves** (≤ 6 each — they drive the review), up to 3 **questions** (short text or yes/no; a yes/no question may be a *knockout*), status `draft · open · closed`, optional `closes_at`.
- `GET /job-templates?category=` — ~26 role templates (bank teller, staff nurse, teacher, driver, cook, cashier, …) with must-haves and knockout questions.
- `POST /jobs/suggest-must-haves` — LLM suggestions from a description; protected-ground items are dropped.
- **Protected-ground filter** (Labour Act 2074 s.6): saving must-haves/questions returns `warnings` for gender, caste/ethnicity, religion, marital status, age bands, pregnancy, disability, looks, origin (English, romanized Nepali, Devanagari). Genuine requirements (licence, night shift, NNC/TSC registration, "18 or older") pass. Saving is never blocked.
- The AI Job Assistant (job_ai, B3) drafts the same fields.

Closing: `PATCH /jobs/{id}` `status=closed` with `closed_reason` `hired` or `cancelled` moves everyone still in new/shortlisted/interview to rejected (position_filled / other) and schedules the kind rejection email. Open jobs close themselves at `closes_at` (`closed_reason=expired`), which only stops new applications. Changing must-haves re-reviews undecided applications.

**Job page = pipeline + candidate panel** (`/recruiter/v2`, see §13). Stage counts, list sorted by best fit (strong → possible → weak → reviewing/flagged; `rank_score` inside a bucket), one-line review summary, source and "referred by". The panel: contact (share flags respected), fit + checks with quotes, answers, CV link/structured CV, other applications count, timeline, notes.

**Decisions.** A person makes every decision: shortlist, reject, invite to interview, make offer, mark hired, move back, withdraw — single or bulk. Each writes a `stage_changed` event and schedules the right fixed email (shortlist/interview invite with the company booking link, offer, kind rejection); emails go out after a 10 s window during which `POST /recruiter/v2/undo` reverts the decision. No separate outreach step, no drafts.

**Word of mouth.** Per-person referral links (`job_referrers`: name, phone, token; link `/jobs/{slug}?ref={token}`), recruiter **quick add** for walk-in / phone / referral candidates (name + phone, optional CV and answers), and CSV export of a job's applications.

**Interviews.** Built-in scheduling, no third-party account. Each recruiter sets weekly hours (default Sun–Fri 10:00–17:00 Asia/Kathmandu), interview length (45 min), buffer and a meeting link (their Meet/Zoom URL, or `auto` for a new Jitsi room). Inviting a shortlisted candidate creates a signed scheduling link showing open times for the next 10 working days. Booking is atomic (row lock per interviewer + partial unique indexes), moves the application to interview, and emails both sides an `.ics` invite (METHOD:REQUEST, TZID Asia/Kathmandu); either side reschedules (SEQUENCE+1) or cancels (METHOD:CANCEL) with the same link. Reminders go out 24 h and 1 h before (one worker sends, Postgres advisory lock + atomic claim). After the interview a person fills a scorecard: each must-have rated 1–4, a recommendation (strong yes · yes · no · strong no) and notes.


**Notifications.** In-app feed for application updates, interview bookings, team requests; mark single / mark-all read.
**Audit log** — company-wide trail of mutating actions per entity (entity_type + entity_id).
**Activity feed** — `/activity/me` (per-user) + `/activity/company` (admin view) of recent significant actions.
**Recruiter preferences** — per-recruiter UI settings (`GET / PATCH /recruiter-preferences`).

**Recruiter AI Chat** — see §7.

---

## 4. Company & Team Management (Admin only)

Company profile (name, website, industry, location, allowed location types, default-active job status). **Logo upload** to S3; old logos cleaned automatically on replace. **Recruiters page**: approve / reject pending join requests, remove active recruiters (revokes access immediately, clears active membership). Membership roles: `recruiter` | `admin`. States: `pending` | `active` | `rejected`. Pending requests surface as dashboard action item.

---

## 5. Data model and states

`Company 1─* Job 1─* Application *─1 Person(User)`; `Application 1─1 Review`, `Application 1─* Event`, `Job 1─* JobReferrer`.

**`JobStatus`** — `draft → open → closed` (`closed_reason`: hired · cancelled · expired); reopening is allowed.
**`ApplicationStage`** — `new → shortlisted → interview → offer → hired`; `rejected` and `withdrawn` from any active stage; "move back" returns to the stage it came from.
**`Review.state`** — `pending → done | needs_person` (flagged CV, unavailable safety check, or repeated failure). `fit` is strong · possible · weak; hidden until done and never shown for a flagged CV.
**Event types** — applied, stage_changed, email_scheduled → email_sent, interview_booked, interview_done, note, review_done, flag_cleared.
**Application source** — linkedin, facebook, merojob, viber, qr, walk_in, phone, referral, direct, other.
**People** — `users.email` is optional; `users.phone` (E.164) identifies phone-only candidates.
**`RecordingStatus`**, **`SyncStatus`** unchanged.

Migration `2017037b521a` maps v1 rows exactly (status → stage, score bands → fit, overview + arrays → description, requirements → must-haves, sent outreach drafts → `email_sent` events) and keeps the old AI fields in a `review_done` event so the downgrade restores them.

---

## 6. Application review (rolling, cost-controlled)

Every application is reviewed shortly after it arrives (background task); nobody waits for a closing date and nothing is auto-decided. Triage (target ≤ NPR 3 per applicant; measured ≈ NPR 0.1 for a full review):

1. **Knockout questions** — deterministic; a wrong answer to a yes/no knockout gives fit weak with the answer as evidence. No LLM.
2. **Injection rail** on the normalised candidate text (NFKC, zero-width/bidi characters removed, whitespace collapsed). A flag → `needs_person` ("Possible hidden instructions…"); a classifier error or 429 is **never** SAFE — retried, then `needs_person`.
3. **Cheap pass** (`REVIEW_CHEAP_MODEL`, gpt-oss-20b) — rubric check per must-have / nice-to-have.
4. **Full evidence review** (`REVIEW_MODEL`, gpt-oss-120b) only when the cheap pass covers ≥ 25 % of must-haves.

The model returns, per criterion, `met / partly / missing` + an exact quote. Each quote must appear in the text (case/whitespace/Unicode-form insensitive, NFC both sides; "…" fragments each checked); a claim without a verified quote becomes `missing` ("no quote, no credit"). **Fit is computed in code**: all must-haves met → strong; ≥ half covered (partly = ½) → possible; else weak. `rank_score` = rubric points (must 2×, nice 1×) + an ML tie-break < 1 point, so the ML signal only orders equal evidence. Temperature 0, strict JSON schema, validation; the job rubric is a fixed prompt prefix (provider prompt caching). Tokens and cost (NPR) are stored on the review. Providers: Groq (default), Bedrock, or a deterministic fake (`REVIEW_PROVIDER`). Retries: 4 attempts, exponential backoff; idempotent (finished reviews are never redone unless criteria change or a person clears a flag); attempts are claimed with compare-and-set so two workers never double-review. Pending reviews resume at startup.

**Blind review.** The reviewer sees no name, contact details, pronouns/honorifics, identity lines (gender, DOB, age, caste, religion, marital status, address — English and Nepali), calendar dates or years, photos, or institution names (kept only when a must-have names a credential). Roles are durations. Works for English, Nepali and mixed text, and for applications with answers only.

**ML tie-break.** The scikit-learn model (synthetic training data) is input to `rank_score` only. Self-reported years never reach it (fixed neutral value) and its text inputs are blind, which removes the audit's blank-years penalty, senior penalty and college-name swings from anything a recruiter sees.

## 7. Recruiter AI Chat

Persistent assistant exclusive to recruiters. Saved sessions, multi-turn context preserved across logins. Sidebar shows all sessions with timestamps; switch to restore full history; start fresh chat anytime.

**Per-turn pipeline.**
**auth → rate limit (per recruiter: 20 msg / min, 10 sessions / 5 min) → Redis idempotency dedupe (10 min TTL on `client_message_id`) → prompt-injection input rail → append to history → maybe summarize → intent router → handler → SSE stream → save state (JSONB + version++) → cache reply for retry**

**Memory + summarization middleware.** History capped at 40 messages; over the cap, Groq compresses older turns to a ~300-word summary while keeping the 6 most recent intact. ~60% context-token reduction with no quality loss. Stored alongside conversation in JSONB; `state_version` increments per turn.

**Intent router.** Groq classifies each message into an intent (structured JSON). If the classifier is unavailable the assistant asks the recruiter to rephrase — it never falls back to web search, so candidate names cannot leak to the search provider.

**7 intent paths.**
- `search_candidates` — semantic search across all company applications via Qdrant; natural language ("strong Python devs from last 3 months, senior") with hybrid retrieval
- `lookup_candidate` — specific application detail (resume summary, AI score, feedback, status)
- `salary_research` — Tavily web search + Groq synthesis; 24-h Redis cache by role + country (5× repeat = 1 call)
- `list_jobs` — open roles across the company
- `lookup_job` — fuzzy informal references ("the backend role", "fintech opening from last month")
- `edit_job` — **14-field allowlist** (title, location, location_type, salary_min, salary_max, currency, overview, responsibilities, requirements, preferred_qualifications, benefits, expiry_date, status, evaluation_threshold). **Staleness check** on `updated_at`; produces before / after preview; pauses for explicit human confirm; never silent write.
- `chat` — general conversation fallback

**Resilience.** Row-level lock (`SELECT … FOR UPDATE`) serializes concurrent writes per session. `state_version` detects stale tabs. **Pronoun guard** ("edit it") refuses if `last_job_set_turn` gap > 2 → asks "which job?". **Cancel words** ("cancel" / "nevermind" / "stop") clear pending mode instantly. Provider fallbacks: Groq down → friendly retry; Tavily down → skip web search; summarize fails → hard cap (no user error).

**Streaming.** SSE token-by-token; first token < 700 ms. Same total tokens as non-streaming but feels instant.

---

## 8. Guardrails (defense in depth)

**Input rail (Groq prompt-injection classifier).** `app/infrastructures/guardrails`. Text is normalised first (NFKC, zero-width and bidi control characters stripped, whitespace collapsed). Untrusted text is wrapped in random per-call delimiter tags. Unattended flows (application review) use `fail_closed=True`: any classifier error or rate limit returns not-safe so the review retries and then goes to a person — never SAFE. Interactive surfaces (recruiter chat, job AI) fail open. Toggle: `guardrails_enabled`.

**Evidence over opinion.** Review quotes are verified against the CV; fit is derived in code; candidates never see AI output; decision emails are fixed templates.

**Protected grounds.** Job criteria and questions are checked against Labour Act 2074 s.6 grounds on save.

**Other safety layers.** Rate limits (public apply, recommend per IP and per job), row-level locks on decisions, compare-and-set review claims, undo window before email.

---

## 9. Data & Infrastructure

**PostgreSQL** — primary store. Alembic migrations. SQLAlchemy 2 async end-to-end.
**Redis** — caches (salary research 24 h, idempotency 10 min, recruiter-chat retry cache 10 min); per-client rate limits (auth/public); session locks.
**Qdrant** — 3072-d Gemini embeddings of jobs (for candidate semantic search) + applications (for recruiter chat candidate search). **Outbox pattern**: every job mutation writes a `JobSyncEvent` row (`PENDING`); a worker reads pending events and upserts / deletes the Qdrant point, then marks `COMPLETED`. Crash-safe — failed events retry.
**S3** — image storage (avatars, company logos). Old logos cleaned on replace.
**SMTP (aiosmtplib)** — decision emails (scheduled as events, sent after the 10 s undo window; overdue ones swept at startup).
**SMS (Sparrow SMS)** — short Nepali texts to candidates at each step (prod only; logged locally).
**APScheduler** — cron-style background jobs (job closing sweep, sync-event retry).

---

## 10. Stack

**Backend.** Python 3.12, FastAPI, SQLAlchemy 2 async, Pydantic v2, Alembic, PostgreSQL, Redis, Qdrant, LangChain v1.x, LangGraph, UV, APScheduler, Argon2, PyJWT, fastapi-limiter, aiosmtplib, WeasyPrint, Jinja2, pytest-asyncio, loguru.
**Frontend.** Next.js 16 App Router, React 19, TypeScript, Redux Toolkit + RTK Query, raw fetch + SSE for chat streams, SCSS tokens (`_variables.scss`), single-source button system (`_buttons.scss`), npm.
**AI / ML.**
- **Groq** — recruiter chat, job drafting, intent classifier, summarization
- **Groq gpt-oss-20b / gpt-oss-120b** — application review (cheap pass / full evidence review); Bedrock optional
- **Gemini** — 3072-d text embeddings
- **Tavily** — web search (salary research, persona context)
- **LlamaCloud** — structured resume parsing
- **scikit-learn RandomForest** — rank tie-break only
- **fastembed** — fast similarity for ML pre-filter features
- **Prompt-injection rail** — Groq classifier (gpt-oss-120b) + deterministic fallback

**External services.** SMTP provider, Sparrow SMS, S3-compatible storage, Jitsi (meeting rooms, no account).

---

## 11. Pipeline at a Glance

```
Apply (link / ?ref= / recommend / quick add)  ──► Review (rolling, ≤ 1 min)
   knockouts ─► injection rail ─► cheap pass ─► full evidence review (if plausible)
                                             └─► fit + summary + checks with quotes
Recruiter decides (one key, bulk, undo 10 s) ──► stage_changed + email (after undo window)
new → shortlisted → interview → offer → hired        rejected / withdrawn
Close job as hired ──► everyone still waiting gets the kind email
```

---

## 12. Product Principles

- **AI assists, humans decide.** Every shortlist call, email send, and job-edit write is human-confirmed.
- **Candidates always hear back.** Decisions send fixed, kind emails automatically after a 10 s undo window.
- **Rolling review.** Every application is reviewed when it arrives; nobody waits for a closing date.
- **Candidates always know where they stand.** Real-time status. Rejection emails use a fixed, respectful template — internal AI review notes are never sent to candidates.
- **One application per job. One booking per application.**
- **Job edits always preview.** Before / after diff with explicit confirm; never silent writes.
- **Humans decide.** AI ranks and summarises; shortlist/reject decisions are confirmed by a recruiter and audit-logged.
- **Defense in depth.** Normalised injection rail (fail-closed for reviews) + verified quotes + blind review + protected-ground warnings + rate limits + idempotency + row-level locks.
- **Cost-aware AI.** Knockouts before any LLM, cheap pass before the full review, cached rubric prefix, per-review token and NPR cost recorded.

---

## 13. Recruiter API v2 (`/recruiter/v2`, active company members)

| Method + path | Purpose |
|---|---|
| `GET /jobs/{job_id}/pipeline?stage=&sort=best_fit\|newest` | Stage counts, reviewing/reviewed counts, applications list |
| `GET /applications/{id}` | Candidate panel |
| `POST /decide` `{action, application_ids[], rejected_reason?}` | shortlist · reject · invite_to_interview · make_offer · mark_hired · move_back · withdraw (1–200 ids) |
| `POST /undo` `{event_ids[]}` | Revert decisions whose email has not gone out |
| `POST /applications/{id}/notes` `{text}` | Timeline note |
| `POST /applications/{id}/clear-flag` | Person checked a flagged CV; review runs (rail skipped) |
| `POST /jobs/{job_id}/candidates` (multipart) | Quick add: full_name, phone, source walk_in·phone·referral, email?, referred_by?, answers (JSON)?, cv? |
| `POST /jobs/{job_id}/referrers` `{name, phone?}` / `GET` | Personal share links + how many applied |
| `GET /jobs/{job_id}/export.csv` | CSV (UTF-8 BOM, Nepali-safe) |

Removed (superseded): `PATCH /applications/{id}/status`, `PATCH /applications/{id}/review`, `GET /applications/company/me`, `GET /applications/job/{id}`, `GET /applications/company/me/candidates/{id}` (+ `/timeline`, `/cv`), `/shortlisting/*`, `/outreach/*`, `POST /jobs/{id}/complete-hiring` (use `PATCH /jobs/{id}` with `status=closed, closed_reason=hired`).

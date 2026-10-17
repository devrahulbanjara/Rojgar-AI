# ConvexHire

AI-assisted recruitment platform running the full hiring funnel end-to-end. Single source of truth for product behaviour, AI internals, security guardrails, and data flow.

---

## 1. Users & Access

| Role | Description | Approval | Capabilities |
|------|-------------|----------|--------------|
| **Candidate** | Job seekers | Instant | Browse, apply, track, chat with AI gap analyzer |
| **Recruiter** | Company hiring team | Admin approval (pending → active) | Jobs, applications, evaluation, shortlisting, outreach, interviews, AI chat |
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

**Apply Flow (5 steps).**
1. Select a saved resume (or create / import one)
2. **Resume Gap Analysis** (optional) — Groq compares chosen resume against JD; returns score 0–100, critical / preferred / bonus gaps, "already strong" items, "add to summary" / "de-emphasize" suggestions, 2-sentence verdict; result cached in Redis 10 min
3. **Auto-Patch** (optional) — Groq rewrites headline (≤120 chars) + summary (≤400 chars) + skills (≤30, ≤5 new) + experience bullets to address gaps. **Frozen Facts** (company, title, dates, institution, certs) are immutable. Server guardrail caps skill additions. Candidate approves every change before save (pending-patch workflow with confirm / discard).
4. Confirm profile share with company
5. Submit — auto-evaluation kicks off if enabled on job

Constraints: one application per job; cannot apply to draft or expired jobs.

**Dashboard.** Totals applied / shortlisted / interview booked / interview completed / offer / rejected.
**Applications page.** Pipeline progress bar, AI score (visible after evaluation), AI feedback, full timeline (applied → shortlist → interview → offer transitions with timestamps), latest status update message. Updates real-time.
**Offer respond.** `POST /applications/{id}/offer/respond` lets candidate accept or decline. Terminal states: `offer_accepted`, `offer_declined`.

---

## 3. Recruiter Experience

**Dashboard.** Pending applications needing attention, upcoming interviews, draft outreach awaiting approval, pending team join requests (admin only). Single action centre.

**Create Jobs (two paths).**
- **Manual form** — title, overview, responsibilities (list), requirements (list), preferred quals, benefits, location, location type, salary range + currency, expiry date. Save as `draft` (hidden) or publish `active`.
- **AI Job Assistant** — recruiter types a brief; LangGraph workflow runs `synthesize_salary` (Tavily web research → Groq structured synthesis) → `generate_draft` (full JobDraft schema) → `validate_draft` (server validators: salary range, location type allowlist, required-field coverage) → human `review` (interrupt) → `refine` loop (edit fields, regenerate selected fields, plain-English feedback) → approved → committed. **Lock fields** before generation so AI cannot override (e.g. salary, title). Returns `assumptions`, `warnings`, `missing_fields`, `validation_errors`.

States: `draft → active → expired`. Expiry auto-set when expiry date passes; stops accepting applications and unlocks shortlisting.

**Applications page.** Cross-job view of every application; filter by job + status.
**Candidates page.** One row per person; multi-applications nested under candidate; click to see scores, status dropdown (direct update), platform resume link.

**Evaluation.** AI reads candidate resume vs JD; produces 0–100 score + plain-English feedback paragraph. Two modes: per-application **auto-eval** on submit (if job has auto-eval enabled), or **batch** "Run AI evaluation" for unscored applications. Recruiters can manually edit any score / feedback. Filters: above-threshold / 50–69 / below-50, reviewed / pending / missing-review, name + email search. Per-job **shortlist threshold** (0–100). **Available only after job has expired** — guarantees fair window for every applicant.

**Shortlisting.** Manual one-by-one, or **AI Finalize** — multi-agent LangGraph (see §6) runs across the cohort; ≥ threshold → shortlisted, rest → rejected. Crash-safe per-application idempotent commit with `ShortlistStatus` (`not_started → in_progress → completed | failed`). Shortlist drafts a **warm invite outreach email**; reject drafts a **kind rejection email with embedded AI feedback**. **No email sends without recruiter approval.**

**Outreach.** Pipeline stages: Generate Drafts → Review & Edit → Approve → Send. In-line edit subject + body; discard suppresses send without deleting record; "Send all" dispatches every approved draft via aiosmtplib. Shortlist email contains **Cal.com booking link** with instructions to use registered name + email. Rejection email embeds AI feedback so candidates know why.

**Interviews.** **Cal.com webhook** auto-detects bookings (matched by candidate's registered name + email); status flips `applied` → `interview_booked`; duplicate booking attempts ignored. `/interviews` page filters by job + date range (today / week / month / custom). Marking complete moves status `interview_booked → interview_completed` and unlocks final decision: `offer` or `rejected`. Offer terminal states are set by candidate response (`offer_accepted` / `offer_declined`).

**Interview Recording + Evaluation.** Recruiter uploads or records interview audio (.webm / .mp3 / .wav / .ogg / .m4a / .mp4). Audio stored in S3 (presigned URL). `RecordingStatus`: `uploaded → transcribing → transcribed → evaluating → evaluated | failed`. **Transcribe** sends audio to a HuggingFace Space hosting **Whisper Small fine-tuned on Nepali speech corpora** — handles English, Nepali, and code-switched candidates. Cold-start retry built in. **Evaluate** runs an LLM against a per-job evaluation schema (rubric criteria with weights) to produce structured competency scores + commentary. Recruiter can also create / edit / delete a manual human evaluation; combined endpoint returns side-by-side AI + human view. **Batch transcribe** processes multiple recordings concurrently.

**Notifications.** In-app feed for application updates, interview bookings, team requests; mark single / mark-all read.
**Audit log** — company-wide trail of mutating actions per entity (entity_type + entity_id).
**Activity feed** — `/activity/me` (per-user) + `/activity/company` (admin view) of recent significant actions.
**Recruiter preferences** — per-recruiter UI settings (`GET / PATCH /recruiter-preferences`).

**Recruiter AI Chat** — see §7.

---

## 4. Company & Team Management (Admin only)

Company profile (name, website, industry, location, allowed location types, default-active job status). **Logo upload** to S3; old logos cleaned automatically on replace. **Recruiters page**: approve / reject pending join requests, remove active recruiters (revokes access immediately, clears active membership). Membership roles: `recruiter` | `admin`. States: `pending` | `active` | `rejected`. Pending requests surface as dashboard action item.

---

## 5. Status State Machines

**`JobStatus`** — `draft → active → expired` (auto on expiry date).
**`ApplicationStatus`** — `applied → shortlisted → interview_booked → interview_completed → offer → offer_accepted | offer_declined`. `rejected` reachable from any non-terminal step.
**`ShortlistStatus`** (per application during AI run) — `not_started → in_progress → completed | failed`.
**`RecordingStatus`** — `uploaded → transcribing → transcribed → evaluating → evaluated | failed`.
**`SyncStatus`** (Qdrant outbox) — `PENDING → COMPLETED | FAILED`.

Transitions enforced in service layer. Frontend keeps two parallel type unions (`ApplicationStatus` in `applicationsApi.ts` + `ApplicationLifecycleStatus` in `statusMetadata.ts`); both must update together.

---

## 6. AI Shortlisting Pipeline (multi-agent LangGraph)

Runs when the job expires (or when a recruiter clicks "Run AI screening"). The AI **recommends**; a recruiter **decides**.

**Step 1 — ML ranking (free).** A scikit-learn RandomForest scores each application in milliseconds from six features: TF-IDF and embedding similarity between resume and JD, years of experience, number of roles, degrees, and skills. *Caveat:* the model was trained on 10,000 **synthetic** labelled pairs (`training.py`), not real hiring outcomes, so its output is used only to **rank**, never to reject. Applications it cannot score (missing experience data or embedding, or a missing model file) stay unscored and are flagged for human review — never given a fabricated score.

**Step 2 — AI review (AWS Bedrock Claude).** Jobs with ≤ 30 applications get an LLM review for everyone; larger jobs review the top 20% by ML rank. Per application:
- **Guardrail** — the resume is screened once by a Groq prompt-injection classifier. A flagged resume is not sent to the reviewers; it is marked *needs human review* with a recruiter-only reason. If the classifier is unavailable, a deterministic marker scan decides instead.
- **Technical reviewer** — technical depth and delivery evidence against the JD. One Tavily search allowed.
- **Role-requirements reviewer** — checks the JD's explicit must-haves (experience level, scope, domain, required credentials). It does **not** judge employment gaps, tenure, or writing style.
- **Critique (optional)** — only when `SHORTLISTING_REFLECTION_MAX_ITERATIONS` ≥ 2; exits when the critique is satisfied *and* confident (≥ 0.7), otherwise one reflection round.
- **Final merge** — Bedrock Claude Haiku merges both reviews into recruiter-facing `strengths` / `weaknesses`.

Blind review: the text sent to the reviewers omits the candidate's name, email, phone, and links (also inside the summary), gives roles as durations instead of dates, and omits institution names. `PIIMiddleware` redacts email / URL / phone as a second layer. The static rubric + JD sit in the cached system prompt; the resume is sent last.

**Step 3 — Recruiter confirms.** Nothing is shortlisted or rejected automatically. When the run finishes the job shows *AI recommendations ready*; the recruiter reviews and clicks **Approve AI recommendations** (or decides individually). Approval is audit-logged with the approving user. Each application records `ai_review_status` (`completed` / `failed` / `needs_human_review`) and an attempt count; a failing review is retried at most `SHORTLISTING_MAX_REVIEW_ATTEMPTS` times and never blocks the rest of the job. Runs are claimed atomically, so multiple workers never duplicate a job.

**Cost.** ML ranking gates large jobs · cacheable per-job system prompt · structured-output caps · critique skipped unless enabled · Haiku merge · 1-call web-search cap. Cost per reviewed application has not been measured in production; record Bedrock usage before quoting savings.

---

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

**Input rail (Groq prompt-injection classifier).** A direct Groq classifier (`app/infrastructures/guardrails`; the NeMo config in `guardrails_config/` is only used by a test script) inspects user-controlled input for prompt-injection / role-hijack / system-prompt-exfil patterns. Untrusted text is wrapped in random per-call delimiter tags. Wired at: application submit and shortlisting (flag → recruiter review, never a silent rejection), resume-gap analyze + auto-patch, recruiter chat send + stream, job-AI generate + refine. Interactive surfaces fail open on classifier errors; unattended flows fall back to a deterministic marker scan. Toggle: `guardrails_enabled`.

**PII redaction (LangChain `PIIMiddleware`).** Email, URL, and phone-number patterns redacted before prompts reach the shortlisting LLM. Defense in depth alongside input rail.

**Hallucination prevention.** Resume auto-patch enforces **Frozen Facts** in code: identity fields are rebuilt from the database, new skills must already be evidenced in the resume text, and rewrites that introduce numbers or technologies the resume never mentions are discarded. Job-edit chat tool restricts writes to **14-field allowlist** with before / after preview + explicit human confirm. Auto-patch additionally caps skill additions (max 5 new, 30 total).

**Other safety layers.** XML tag scrubber + `<user_message>` wrapping in chat. Recruiter DB strings sanitised before LLM. Idempotency keys prevent double LLM calls on retry. Rate limits stop abuse. Row-level locks stop concurrent state corruption.

---

## 9. Data & Infrastructure

**PostgreSQL** — primary store. Alembic migrations. SQLAlchemy 2 async end-to-end.
**Redis** — caches (gap analysis 10 min, salary research 24 h, idempotency 10 min, recruiter-chat retry cache 10 min); rate limiter (`fastapi-limiter`); session locks.
**Qdrant** — 3072-d Gemini embeddings of jobs (for candidate semantic search) + applications (for recruiter chat candidate search). **Outbox pattern**: every job mutation writes a `JobSyncEvent` row (`PENDING`); a worker reads pending events and upserts / deletes the Qdrant point, then marks `COMPLETED`. Crash-safe — failed events retry.
**S3** — image storage (avatars, company logos) + interview audio. Presigned URLs for private playback. Old logos cleaned on replace.
**HuggingFace Space** — Whisper Small fine-tuned on Nepali audio for interview transcription. Cold-start aware client with retry.
**SMTP (aiosmtplib)** — outbound email via configured provider.
**Cal.com** — interview booking link in shortlist email; webhook handler auto-flips application status on booking.
**APScheduler** — cron-style background jobs (job expiry sweep, sync-event retry).

---

## 10. Stack

**Backend.** Python 3.12, FastAPI, SQLAlchemy 2 async, Pydantic v2, Alembic, PostgreSQL, Redis, Qdrant, LangChain v1.x, LangGraph, UV, APScheduler, Argon2, PyJWT, fastapi-limiter, aiosmtplib, WeasyPrint, Jinja2, pytest-asyncio, loguru.
**Frontend.** Next.js 16 App Router, React 19, TypeScript, Redux Toolkit + RTK Query, raw fetch + SSE for chat streams, SCSS tokens (`_variables.scss`), single-source button system (`_buttons.scss`), pnpm.
**AI / ML.**
- **Groq** — recruiter chat, job drafting, resume gap analysis, intent classifier, summarization
- **AWS Bedrock Claude** — shortlisting multi-agent only (heavier reasoning)
- **Gemini** — 3072-d text embeddings
- **Tavily** — web search (salary research, persona context)
- **LlamaCloud** — structured resume parsing
- **scikit-learn RandomForest** — shortlisting ML pre-filter
- **fastembed** — fast similarity for ML pre-filter features
- **Whisper Small fine-tuned on Nepali audio** — hosted on HF Space; transcribes English + Nepali + code-switched interviews
- **Prompt-injection rail** — Groq classifier (gpt-oss-120b) + deterministic fallback
- **LangChain PIIMiddleware** — email / URL / phone redaction in shortlisting

**External services.** Cal.com (booking + webhook), SMTP provider, S3-compatible storage, HuggingFace Spaces.

---

## 11. Pipeline at a Glance

```
Apply (with optional Gap Analysis + Auto-Patch using Frozen Facts)
   ↓
applied  ──[ML pre-filter top 20% ➜ CTO + HR critique loop ➜ Judge ➜ Final merge]──► shortlisted | rejected
                                                                                          ↓
                                                                   outreach drafted ➜ recruiter approves ➜ email sent
                                                                                          ↓
                                                                          Cal.com booking webhook auto-detect
                                                                                          ↓
                                                       interview_booked ➜ recording uploaded ➜ Whisper-NP transcribe ➜ AI evaluation
                                                                                          ↓
                                                                              recruiter marks complete
                                                                                          ↓
                                                                            interview_completed
                                                                                          ↓
                                                                           offer | rejected
                                                                                          ↓
                                                                  offer_accepted | offer_declined  (terminal)
```

---

## 12. Product Principles

- **AI assists, humans decide.** Every shortlist call, email send, and job-edit write is human-confirmed.
- **No silent emails.** Every outreach draft sits in review queue until reviewed + approved.
- **Pipeline opens only after expiry.** Fair window for every applicant.
- **Candidates always know where they stand.** Real-time status. Rejection emails use a fixed, respectful template — internal AI review notes are never sent to candidates.
- **One application per job. One booking per application.**
- **Job edits always preview.** Before / after diff with explicit confirm; never silent writes.
- **Humans decide.** AI ranks and summarises; shortlist/reject decisions are confirmed by a recruiter and audit-logged.
- **Defense in depth.** Prompt-injection rail + PIIMiddleware + Frozen Facts + 14-field allowlist + rate limits + idempotency + row-level locks.
- **Cost-aware AI.** ML ranking for large jobs, prompt caching, schema caps, optional critique, summarization, salary cache, cheap-model final merge.

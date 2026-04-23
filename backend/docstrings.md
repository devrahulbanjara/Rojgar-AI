# ConvexHire Backend — Docstring Reference

> Complete function/class/method documentation for every meaningful symbol in the backend.
> Organised by file path. Use this as a reference when reading or maintaining the codebase.

---

## Table of Contents

- [Agents — Shortlisting](#agents--shortlisting)
- [Core](#core)
- [Infrastructures](#infrastructures)
- [Modules — Activity](#modules--activity)
- [Modules — Applications](#modules--applications)
- [Modules — Auth](#modules--auth)
- [Modules — Audit](#modules--audit)

---

## Agents — Shortlisting

### `app/agents/shortlisting/graph.py`

#### `create_workflow() -> StateGraph`
Builds the LangGraph shortlisting workflow.

Topology (parallel start → shared critique loop → final):
```
START → cto, hr (parallel)
     → critique
     → router → (cto, hr) | final
final → END
```
Returns an uncompiled `StateGraph`. Call `.compile()` before invoking.

---

### `app/agents/shortlisting/nodes/critique_node.py`

#### `critique_node(state: ShortlistState) -> dict`
LangGraph node. Reads the latest CTO and HR evaluations, calls the LLM with `CRITIQUE_PROMPT`, and returns:
- `critiques` — list appended with the new critique string
- `is_satisfied` — bool; True if both evaluations are good enough to stop
- `iteration` — current loop count incremented by 1

---

### `app/agents/shortlisting/nodes/cto_node.py`

#### `cto_node(state: ShortlistState) -> dict`
LangGraph node. Runs a tool-calling agent acting as the CTO evaluator.

Focuses on: technical fit, engineering depth, architecture ownership, software delivery evidence.
May call `web_search` for unfamiliar frameworks or vendor claims.
Returns `{"cto_evals": [PersonaEvaluation]}` — appended to state list.

---

### `app/agents/shortlisting/nodes/hr_node.py`

#### `hr_node(state: ShortlistState) -> dict`
LangGraph node. Runs a tool-calling agent acting as the HR lead evaluator.

Focuses on: seniority, career progression, communication signals, role consistency, hiring risk.
May call `web_search` for unknown employers or market context.
Returns `{"hr_evals": [PersonaEvaluation]}` — appended to state list.

---

### `app/agents/shortlisting/nodes/final_node.py`

#### `final_node(state: ShortlistState) -> dict`
LangGraph node. Merges the last CTO and HR evaluations into a single recruiter-facing result.

Returns:
- `final_score` — consensus score 0–100
- `final_reason` — one-sentence rationale
- `final_feedback` — 2–4 sentence recruiter summary with strengths, concerns, and next step

---

### `app/agents/shortlisting/nodes/router.py`

#### `router(state: ShortlistState) -> str | list[str]`
LangGraph conditional edge function.

Returns `"final"` if the critique is satisfied OR `max_iterations` is reached.
Returns `["cto", "hr"]` to trigger another reflection round otherwise.

---

### `app/agents/shortlisting/schemas.py`

#### `PersonaEvaluation` (Pydantic model)
Output schema for CTO and HR evaluator nodes.

| Field | Type | Description |
|---|---|---|
| `score` | `int` 0–100 | Numeric rating |
| `reason` | `str` | Main rationale |
| `strengths` | `list[str]` | Positive signals found |
| `concerns` | `list[str]` | Risk factors or gaps |
| `evidence` | `list[str]` | Resume/JD quotes used |
| `search_notes` | `list[str]` | Notes from web search tool calls |

#### `JudgeResponse` (Pydantic model)
Output schema for the critique node.

| Field | Type | Description |
|---|---|---|
| `is_satisfied` | `bool` | Whether to stop iterating |
| `critique` | `str` | Actionable feedback for next round |

#### `FinalResponse` (Pydantic model)
Output schema for the final node.

| Field | Type | Description |
|---|---|---|
| `score` | `int` 0–100 | Consensus score |
| `reason` | `str` | One-line rationale |
| `feedback` | `str` | Recruiter-facing summary |

#### `ShortlistState` (TypedDict)
LangGraph state bag passed between all nodes.

| Key | Type | Notes |
|---|---|---|
| `job_title` | `str` | Title of the job being screened |
| `jd` | `str` | Stringified job description |
| `resume` | `str` | Stringified candidate resume |
| `max_iterations` | `int` | Reflection loop cap |
| `iteration` | `int` | Current loop count |
| `cto_evals` | `list[PersonaEvaluation]` | Accumulates via `operator.add` |
| `hr_evals` | `list[PersonaEvaluation]` | Accumulates via `operator.add` |
| `critiques` | `list[str]` | Accumulates via `operator.add` |
| `is_satisfied` | `bool` | Set by critique node |
| `final_score` | `int` | Set by final node |
| `final_reason` | `str` | Set by final node |
| `final_feedback` | `str` | Set by final node |

---

### `app/agents/shortlisting/service.py`

#### `ShortlistingAgentResult` (dataclass)
Plain result container returned to callers after the workflow completes.

Fields: `score: int`, `reason: str`, `feedback: str`.

#### `stringify_job(job: Job) -> str`
Serialises a `Job` ORM object into a structured plain-text string for the LLM prompt.
Covers: title, location, overview, responsibilities, requirements, preferred qualifications, benefits.
Missing fields are replaced with `"Not provided"` to avoid prompt ambiguity.

#### `stringify_resume(application: Application) -> str`
Serialises the resume attached to an `Application` into a structured plain-text string.
Covers: headline, summary, years of experience, work history, education, skills.
Returns `"Resume: Not attached."` if no resume is linked.

#### `build_shortlisting_inputs(job: Job, application: Application) -> dict`
Constructs the initial `ShortlistState` dict to feed into the workflow.
Sets `iteration=0`, empty eval lists, `is_satisfied=False`, and pulls `max_iterations` from settings.

#### `get_compiled_shortlisting_workflow()`
Returns the compiled LangGraph workflow. Result is cached (`lru_cache(maxsize=1)`) — compiled once per process lifetime.

#### `build_shortlisting_result(result: dict) -> ShortlistingAgentResult`
Extracts `final_score`, `final_reason`, `final_feedback` from the raw workflow output dict.

#### `evaluate_application_with_shortlisting_agent(*, job: Job, application: Application) -> ShortlistingAgentResult`
**Main entry point.** Runs the full multi-agent shortlisting workflow for a single application.
Logs start/end. Raises if the workflow fails internally.

---

### `app/agents/shortlisting/tools.py`

#### `web_search(query: str) -> list[dict]`
LangChain tool exposed to CTO and HR agents.
Delegates to `search_service.query()` with `max_results` from settings.
Used to verify unfamiliar tech stacks, employers, or market claims found in resumes.

---

## Core

### `app/core/cache.py`

All functions invalidate specific Redis cache keys or patterns. They never raise — cache misses are silent. Call after DB writes that would make cached data stale.

#### `_get_active_company_member_ids(db, company_id) -> list[str]`
Returns user IDs of all `active` members for a company. Internal helper used by cache invalidators that need to target per-member keys.

#### `invalidate_candidate_read_caches(user_id: str) -> None`
Deletes candidate dashboard and application list caches for a given user.
Call after: applying to a job, updating profile, or status changes.

#### `invalidate_profile_read_caches(user_id: str) -> None`
Deletes profile detail and candidate dashboard caches for a user.
Call after: profile updates.

#### `invalidate_candidate_read_caches_for_users(user_ids: Iterable[str]) -> None`
Batch version of `invalidate_candidate_read_caches`. Deduplicates IDs before processing.

#### `invalidate_company_dashboard_caches(db, company_id: str) -> None`
Deletes recruiter and recruiter-admin dashboard caches for every active member of a company.
Call after: new application, status change, job creation/update.

#### `invalidate_company_detail_caches(db, company_id: str) -> None`
Deletes `company:detail:{member_id}` keys for all active company members.
Call after: company profile updates.

#### `invalidate_company_application_caches(company_id: str, application_id: str | None) -> None`
Invalidates company-level application list caches (all jobs). Optionally also invalidates a specific candidate-detail cache when `application_id` is given.

#### `invalidate_application_candidate_detail_caches(application_ids, company_id) -> None`
Invalidates candidate-detail cache entries for a list of application IDs.
If `company_id` is None, uses a wildcard pattern to hit all companies.

#### `invalidate_interview_list_caches(company_id: str) -> None`
Invalidates all interview list caches for a company. Call after interview status changes.

#### `invalidate_job_detail_caches(job_id: str) -> None`
Deletes job detail cache and all per-candidate job-detail variants.
Call after job create/update/expiry.

#### `invalidate_resume_caches(user_id, resume_id) -> None`
Deletes resume list cache for a user. Optionally also deletes a specific resume detail entry.

#### `invalidate_resume_gap_caches(resume_id: str) -> None`
Invalidates all resume gap analysis caches for a given resume.

#### `get_company_applicant_user_ids(db, company_id) -> list[str]`
Returns all distinct user IDs who have ever applied to any job at a given company.

#### `get_job_applicant_user_ids(db, job_id) -> list[str]`
Returns all distinct user IDs who have applied to a specific job.

#### `get_resume_application_ids(db, resume_id) -> list[str]`
Returns all application IDs that reference a specific resume.

---

### `app/core/config.py`

#### `Settings` (Pydantic `BaseSettings`)
Single source of truth for all environment variables. Loaded from `.env`.

Key property methods:

| Property | Returns |
|---|---|
| `database_url` | `asyncpg` DSN for the main DB |
| `test_database_url` | `asyncpg` DSN for the test DB |
| `s3_base_url` | Public base URL for S3 uploads |
| `langgraph_postgres_dsn` | Sync postgres DSN for LangGraph checkpointer |

---

### `app/core/database.py`

#### `Base` (SQLAlchemy `DeclarativeBase` + `AsyncAttrs`)
Base class for all ORM models. `AsyncAttrs` allows `await`-ing lazy-loaded relationships without triggering `MissingGreenlet` errors.

#### `_apply_pk_defaults(target, args, kwargs) -> None`
SQLAlchemy `init` event listener. Sets Python-side UUID primary keys at object construction time so `instance.id` is non-null inside `before_flush` events and related code.

#### `get_db() -> AsyncGenerator[AsyncSession, None]`
FastAPI dependency. Yields one `AsyncSession` per request. Automatically rolls back on exception; always closes the session.

---

### `app/core/exception_handlers.py`

#### `register_exception_handlers(app: FastAPI) -> None`
Registers three global exception handlers on the app instance. Call once in `main.py`.

| Handler | Trigger | Response |
|---|---|---|
| `validation_exception_handler` | Pydantic 422 errors | 400 with field-level `errors` list |
| `http_exception_handler` | Any `HTTPException` | Matching status code, unified envelope |
| `universal_exception_handler` | Uncaught exceptions | 500; traceback hidden in production |

---

### `app/core/job_expiry_scheduler.py`

#### `_expire_due_jobs_once() -> int`
Runs `expire_due_jobs` using the shared `AsyncSessionLocal`. For startup checks only — must run inside the existing event loop.

#### `_expire_due_jobs_once_in_scheduler_thread() -> int`
Creates a fresh async engine + session factory and runs `expire_due_jobs`. Required because APScheduler fires callbacks in a background thread with no existing event loop.

#### `_run_expire_due_jobs() -> None`
Synchronous wrapper called by APScheduler. Calls `asyncio.run(...)` and logs how many jobs were expired.

#### `create_job_expiry_scheduler() -> BackgroundScheduler`
Creates and returns an APScheduler `BackgroundScheduler` with one daily cron job: expire due jobs at 21:15 UTC.

#### `run_job_expiry_startup_check() -> None`
Async function called on app startup. Expires any jobs that passed their `expires_at` while the app was down.

---

### `app/core/logging_config.py`

#### `setup_logging() -> None`
Configures loguru. Debug mode: coloured stdout at DEBUG level. Production: INFO on stdout + rotating file (`logs/app.log`, 10MB rotation, 30-day retention, zip compression).

---

### `app/core/request_context.py`

#### `RequestContext` (frozen dataclass)
Immutable request metadata bag stored in a `ContextVar`. Fields: `request_id`, `request_path`, `request_method`, `ip_address`, `user_agent`, `actor_user_id`, `actor_role`, `source`.

#### `get_request_context() -> RequestContext`
Returns the current request context from the `ContextVar`. Safe to call anywhere in the call stack during a request.

#### `set_request_context(context: RequestContext)`
Replaces the current context. Returns the reset token — pass to `reset_request_context` in a `finally` block.

#### `reset_request_context(token) -> None`
Resets the `ContextVar` to its previous value. Always call in `finally` to prevent context leakage across requests.

#### `bind_actor(*, actor_user_id, actor_role) -> None`
Enriches the current context with the authenticated user's ID and role. Called from auth dependencies after token validation.

---

### `app/core/request_middleware.py`

#### `RequestContextMiddleware.dispatch(request, call_next) -> Response`
Starlette middleware. On every request:
1. Generates or reads `X-Request-ID` header.
2. Extracts real IP from `X-Forwarded-For`.
3. Sets the `RequestContext` in the `ContextVar`.
4. Calls the next handler; resets context in `finally`.
5. Adds `X-Request-ID` header to the response.

---

### `app/core/responses.py`

#### `PaginationMeta` (Pydantic model)
Holds pagination metadata: `total`, `page`, `size`, `total_pages`.

#### `PaginatedData[T]` (Pydantic generic model)
Wraps a paginated response: `items: list[T]` + `pagination: PaginationMeta`.

#### `ResponseMeta` (Pydantic model)
Metadata attached to every response envelope: `timestamp` (UTC ISO) and `requestId`.

#### `UnifiedResponse[T]` (Pydantic generic model)
Master response envelope. Every endpoint returns this shape.
```
{
  "success": bool,
  "message": str,
  "data": T | PaginatedData[T] | null,
  "errors": any | null,
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

#### `ResponseBuilder._meta() -> dict`
Builds the `meta` block from the current `RequestContext`. Internal.

#### `ResponseBuilder.success(data, message, status_code, response) -> JSONResponse`
Wraps `data` in a `UnifiedResponse` with `success=True`. Uses `jsonable_encoder` so ORM objects, datetimes, and UUIDs serialise correctly. Merges headers from a `response` object if provided.

#### `ResponseBuilder.error(errors, message, status_code, response) -> JSONResponse`
Wraps an error payload in a `UnifiedResponse` with `success=False`.

#### `ResponseBuilder.paginated(items, total, page, size, message, status_code) -> JSONResponse`
Produces a paginated `UnifiedResponse`. Calculates `total_pages` automatically.

---

### `app/core/schemas.py`

#### `BaseSchema` (Pydantic model)
Base for all Pydantic schemas. Enables `from_attributes=True` (ORM mode) globally.

---

### `app/core/security.py`

#### `hash_password(password: str) -> str`
Hashes a plain-text password using Argon2.

#### `verify_password(hashed, plain) -> bool`
Verifies a plain-text password against an Argon2 hash. Returns `False` if `hashed` is `None`.

#### `create_tokens(user_id: str) -> tuple[dict, str, datetime]`
Creates a pair of JWTs (access + refresh) for a user.
- Access token expires in `access_token_expire_minutes`.
- Refresh token carries a UUID `jti` and expires in `refresh_token_expire_days`.
- Returns `(token_dict, jti, refresh_expires_at)`. Caller must persist the JTI.

#### `decode_access_token(token: str) -> str | None`
Validates and decodes an access JWT. Returns `user_id` (the `sub` claim) or `None` if invalid/expired/wrong type.

#### `decode_refresh_token(token: str) -> tuple[str, str] | None`
Validates and decodes a refresh JWT. Returns `(user_id, jti)` or `None`.

#### `create_setup_token(user_id: str) -> str`
Creates a short-lived (15-minute) JWT used to authenticate the company registration step that follows a recruiter/admin signup.

#### `decode_setup_token(token: str) -> str | None`
Validates a setup token. Returns `user_id` or `None`.

#### `create_pending_signup_token(data: dict) -> str`
Creates a 24-hour JWT embedding all data needed to complete user creation when the email verification link is clicked. No DB row is written at signup time — the token **is** the verification link.

Supported `type` values in payload:
- `"pending_candidate"` — plain candidate signup
- `"pending_company"` — recruiter_admin; carries company details
- `"pending_recruiter"` — recruiter; carries join-company name

#### `decode_pending_signup_token(token: str) -> dict | None`
Validates a pending-signup JWT. Accepts `setup`, `pending_candidate`, `pending_company`, `pending_recruiter` types. Returns full payload dict or `None`.

#### `create_signup_token(data: dict) -> str`
Creates a 15-minute JWT holding Google profile data (email, name, avatar, google_id) used for the two-phase social signup flow.

#### `decode_signup_token(token: str) -> dict | None`
Validates a signup token (`type == "signup"`). Returns payload dict or `None`.

---

### `app/core/tasks.py`

#### `sync_daemon_loop() -> None`
Background async loop. Runs forever, sleeping 60 seconds between iterations.
Each cycle: calls `process_pending_events()` for both job and application sync queues.
Acts as a safety net on top of per-request `BackgroundTask` calls — guarantees eventual Qdrant consistency even after transient failures. Handles `CancelledError` for graceful shutdown.

---

## Infrastructures

### `app/infrastructures/ai/service.py`

#### `_walk_groq_strict_schema(node) -> None`
Recursive helper. Mutates a JSON Schema dict in-place to be Groq strict-mode compatible:
- Adds `"required"` containing all property keys
- Sets `"additionalProperties": false`
- Recurses into nested objects, arrays, `$defs`, `anyOf`, etc.

#### `_to_groq_strict_json_schema(schema_model: Type[SchemaT]) -> dict`
Generates a deep-copied, Groq-compatible strict JSON Schema from a Pydantic model class.

#### `_extract_groq_error_message(exc) -> str`
Extracts the human-readable error string from a Groq `APIStatusError` body. Falls back to `str(exc)`.

#### `_is_groq_rate_limit(exc) -> bool`
Returns `True` if a Groq exception indicates a rate limit or token cap (HTTP 413/429, `rate_limit_exceeded` code, or "tokens per minute" in the message).

#### `AIService` (class)
Single wrapper for all LLM and embedding calls. Swap providers here without touching business logic.

#### `AIService._get_embeddings_client() -> GoogleGenerativeAIEmbeddings`
Lazily initialises and returns the Gemini embedding client. Import deferred to avoid loading at startup.

#### `AIService.get_embeddings(text: str) -> list[float]`
Returns a float embedding vector for `text`. Caches results in Redis keyed by a 16-char SHA-256 prefix. TTL: 1 hour. On cache miss, calls Gemini and caches the result.

#### `AIService._build_chat_model(model, temperature) -> ChatGroq`
Instantiates a `ChatGroq` client for streaming. Uses `groq_model_recruiter_chat` by default.

#### `AIService.generate_structured(system_prompt, user_payload, schema_model, model) -> SchemaT`
Calls the Groq chat API with a strict JSON Schema response format.
- Appends output constraints to the system prompt.
- Sends `user_payload` as JSON.
- Validates the response against `schema_model`.
- Raises HTTP 429 on rate limit, 502 on any other Groq error.

#### `AIService.stream_text(system_prompt, user_payload, model, temperature) -> AsyncIterator[str]`
Streams plain text from the LLM token by token. Used by recruiter chat and job drafting.

---

### `app/infrastructures/aws/bedrock.py`

#### `get_bedrock_llm() -> ChatBedrockConverse`
Returns a cached (lru_cache maxsize=1) `ChatBedrockConverse` client configured for the shortlisting workflow. Uses dedicated AWS credentials from settings.

---

### `app/infrastructures/email/service.py`

#### `EmailService._send(subject, recipient, html_content) -> None`
Internal. Builds and dispatches an HTML email via SMTP using `aiosmtplib`. Skips sending if `settings.send_emails` is False (logs instead). Logs errors but does not raise.

#### `EmailService.send_verification(email, token) -> None`
Sends the email verification link. Token is embedded as a query param on `{frontend_url}/verify-email`.

#### `EmailService.send_password_reset(email, token) -> None`
Sends the password reset link. Expires in 1 hour (managed by the caller).

#### `EmailService.send_generic_email(to_email, subject, html_body) -> None`
Generic email sender for custom content (status notifications, offer confirmations, etc.).

---

### `app/infrastructures/qdrant/service.py`

#### `_expires_at_to_ts(value: datetime | None) -> int`
Converts a `datetime` to a Unix timestamp integer for Qdrant numeric filtering. Returns `QDRANT_NO_EXPIRY_TS` (year 3000) for `None`.

#### `QdrantService.initialize() -> None`
Creates collections and payload indexes if they don't exist yet. Called at app startup. Logs but does not crash on failure.

#### `QdrantService._ensure_collection(collection_name) -> None`
Creates a cosine-distance vector collection if it doesn't already exist.

#### `QdrantService._ensure_payload_indexes(collection_name, keyword_fields, integer_fields, text_fields) -> None`
Creates filterable payload indexes for keyword, integer, and text fields. Skips silently if the index already exists.

#### `QdrantService._ensure_job_indexes() -> None`
Creates indexes for the job collection: keyword (`status`, `location_type`, `company_id`), integer (`salary_min`, `salary_max`, `expires_at_ts`), text (`location`).

#### `QdrantService._ensure_candidate_indexes() -> None`
Creates indexes for the candidate collection: keyword (`company_id`, `job_id`, `user_id`, `application_status`), integer (`score`, `updated_at_ts`).

#### `QdrantService._build_job_document(job) -> str`
Concatenates all relevant job fields into a single string for embedding. Format: `TITLE:`, `OVERVIEW:`, `RESPONSIBILITIES:`, `REQUIREMENTS:`, `PREFERRED QUALIFICATIONS:`, `BENEFITS:`.

#### `QdrantService._build_application_document(application, job) -> str`
Concatenates candidate + job fields into a single string for embedding. Includes name, email, job title, status, score, feedback, resume headline/summary, skills, experience, education.

#### `QdrantService.upsert_job(job) -> None`
Embeds and upserts a job to Qdrant. Skips non-active jobs and already-expired jobs. Re-raises on failure so the outbox processor can mark the sync event as FAILED.

#### `QdrantService.delete_job(job_id: uuid.UUID) -> None`
Removes a job vector from Qdrant by ID. Re-raises on failure.

#### `QdrantService.upsert_application(application, job) -> None`
Embeds and upserts a candidate application to the candidate collection. Payload includes company_id, job_id, user_id, status, score, and `updated_at_ts` for recency sorting. Re-raises on failure.

#### `QdrantService.delete_application(application_id: uuid.UUID) -> None`
Removes an application vector from the candidate collection. Re-raises on failure.

#### `QdrantService.search_jobs(query, location, location_type, salary_min, salary_max, page, size) -> tuple[list[dict], int]`
Semantic job search with optional filters. Strategy:
1. Run strict search (active + not expired + all filters).
2. If results < page size, fill remaining slots with fallback results (active + not expired, filters excluded), marked `is_fallback: True`.

Returns `(results, total_count)`. Each result: `{"job_id", "score", "is_fallback"}`.

#### `QdrantService.search_applications(query, *, company_id, statuses, limit) -> list[dict]`
Semantic search over candidate applications scoped to a company. Optionally filtered by one or more `application_status` values.
Returns list of `{"application_id", "score"}`.

---

### `app/infrastructures/redis/service.py`

#### `RedisService.connect() -> None`
Initialises the async Redis client from `settings.redis_url`. If Redis is disabled or the URL is missing, logs a warning and leaves `_client = None`. All subsequent operations are no-ops when `_client` is `None`.

#### `RedisService.disconnect() -> None`
Closes the Redis connection gracefully.

#### `RedisService._build_key(key) -> str`
Prepends `convexhire:{environment}:` to all cache keys for namespace isolation.

#### `RedisService._build_ttl(ttl_seconds, ttl_jitter_seconds) -> int`
Returns `ttl_seconds + randint(0, ttl_jitter_seconds)`. Jitter prevents cache stampedes when many keys expire at the same time. Raises `ValueError` if `ttl_seconds <= 0`.

#### `RedisService.get(key) -> str | None`
Fetches a cached value. Returns `None` on cache miss or Redis failure (graceful degradation).

#### `RedisService.set(key, value, ttl_seconds, *, ttl_jitter_seconds) -> None`
Stores a value with TTL. Silently skips if Redis is unavailable.

#### `RedisService.delete(key) -> None`
Deletes a single key. Delegates to `delete_many`.

#### `RedisService.delete_many(*keys) -> None`
Deletes multiple keys in one Redis `UNLINK` call (non-blocking delete).

#### `RedisService.invalidate_pattern(pattern) -> None`
Invalidates all keys matching a glob pattern. Delegates to `invalidate_patterns`.

#### `RedisService.invalidate_patterns(*patterns) -> None`
For each pattern, iterates with `SCAN` (batch size 200) and `UNLINK`s matching keys. Avoids blocking `KEYS` scans.

---

### `app/infrastructures/resume_extraction/service.py`

#### `ResumeExtractionService._get_client()`
Lazily initialises the `LlamaExtract` client. Raises HTTP 500 if the API key is missing or the package is not installed.

#### `ResumeExtractionService.validate_upload(file: UploadFile) -> None`
Validates that the uploaded file is a PDF, non-empty, and within the size limit (`resume_import_max_upload_bytes`). Raises HTTP 400 on failure.

#### `ResumeExtractionService._build_extract_config()`
Builds the `ExtractConfig` for LlamaExtract using settings (mode, parse model, extract model). Raises HTTP 500 if `llama-cloud` is not installed.

#### `ResumeExtractionService.extract_structured(file, data_schema, output_model) -> SchemaT`
Full extraction pipeline for an `UploadFile`:
1. Validates the upload.
2. Writes to a temp file.
3. Calls `LlamaExtract.extract()` in a thread (blocking SDK).
4. Validates the raw output against `output_model`.
5. Cleans up the temp file in `finally` and resets the file stream.
Raises HTTP 422 if extraction fails.

#### `ResumeExtractionService.extract_structured_from_path(file_path, source_file_name, data_schema, output_model) -> SchemaT`
Same as `extract_structured` but accepts a filesystem path instead of an `UploadFile`. Used for benchmarking and batch processing.

---

### `app/infrastructures/search/service.py`

#### `SearchService.query(query, max_results, search_depth, country, **kwargs) -> list[dict]`
Executes a Tavily web search. Appends `country` to the query string if not already present. Returns a list of standardised dicts: `{title, url, content, raw_content, relevance_score}`. Returns empty list on failure.

---

### `app/infrastructures/storage/service.py`

#### `StorageService.client -> BaseClient` (property)
Lazily initialises the boto3 S3 client using credentials from settings.

#### `StorageService.upload_image(file: UploadFile, folder: str) -> str`
Validates content type, extension (against `s3_allowed_image_extensions`), and file size (against `s3_max_upload_bytes`). Uploads to `{folder}/{uuid}.{ext}` and returns the public S3 URL. Public access is via bucket policy, not ACL.

#### `StorageService.delete_image(image_url: str | None) -> None`
Deletes an S3 object given its full URL. Extracts the key from the URL. Logs errors but does not raise.

#### `StorageService._extract_key(image_url) -> str | None`
Extracts the S3 object key from a full URL by stripping the path prefix.

#### `StorageService._extract_extension(filename) -> str`
Extracts the file extension (lowercase). Falls back to `"jpg"` if none found.

#### `StorageService._get_file_size(file: UploadFile) -> int`
Reads file size without consuming the stream by seeking to end and back.

#### `StorageService.upload_audio(file: UploadFile, folder: str) -> tuple[str, str]`
Validates audio format (webm, mp4, ogg, wav, m4a, mpeg, mpga) and file size (200MB cap). Uploads to S3 and returns `(public_url, s3_key)`.

#### `StorageService.generate_presigned_url(file_key, expires_in) -> str`
Generates a time-limited presigned S3 URL. Falls back to the static public URL if presign fails.

---

### `app/infrastructures/whisper/service.py`

#### `WhisperService.transcribe_from_bytes(audio_bytes, filename) -> str`
Async entry point. Delegates to `_transcribe_bytes` via `asyncio.to_thread` to avoid blocking the event loop.

#### `WhisperService._transcribe_bytes(audio_bytes, filename) -> str`
Synchronous implementation. Writes audio bytes to a temp file, calls Groq's `whisper-large-v3-turbo` model, and returns the transcription text. Temp file is always cleaned up.

---

## Modules — Activity

### `app/modules/activity/models.py`

#### `ActivityEvent` (ORM model)
Persistent record of any notable action in the system. Drives both the activity feed and in-app notifications.

Key columns: `event_type`, `audience` (`"candidate"` | `"recruiter"` | `"admin"`), `title`, `description`, `href`, `metadata_json`.

Optional FK references: `user_id`, `company_id`, `application_id`, `job_id`, `interview_id`, `draft_id`, `actor_user_id`.

---

### `app/modules/activity/service.py`

#### `create_activity_event(db, *, event_type, audience, title, ..., create_in_app_notification) -> ActivityEvent`
Creates and flushes an `ActivityEvent`. If `create_in_app_notification=True` (default), also calls `create_notification`. Does not commit — caller is responsible.

#### `list_my_activity(db, user, *, limit) -> list[ActivityEventResponse]`
Returns activity events where the user is either the subject (`user_id`) or the actor (`actor_user_id`). Sorted newest-first, capped at `limit`.

#### `_get_active_company_id(db, user_id) -> uuid.UUID`
Returns the active company ID for a recruiter. Raises HTTP 403 if not found. Internal helper.

#### `list_company_activity(db, user, *, limit) -> list[ActivityEventResponse]`
Returns all activity events scoped to the authenticated recruiter's company. Sorted newest-first.

#### `list_application_timeline(db, *, application_id, audience) -> list[ActivityEventResponse]`
Returns all activity events for a specific application, optionally filtered by audience. Sorted oldest-first (chronological timeline).

---

## Modules — Applications

### `app/modules/applications/models.py`

#### `Application` (ORM model)
Core application record. One per (job, user) pair (`uq_application_job_user` unique constraint).

Privacy fields (`share_*`) control what candidate data the recruiter can see. Snapshot fields (`shared_*`) capture the candidate's data at application time, preventing live profile changes from affecting recruiter views.

#### `ApplicationSyncEvent` (ORM model)
Outbox record for Qdrant sync operations. One event per application change. Status: `PENDING` → `COMPLETED` | `FAILED`.

---

### `app/modules/applications/service.py`

#### `_status_email_html(status, *, applicant_name, job_title, company_name, app_href) -> tuple[str, str]`
Returns `(subject, html_body)` for candidate status notification emails. Handles `shortlisted`, `rejected`, `offer`. Returns empty strings for other statuses.

#### `_status_event_copy(status, *, applicant_name, job_title, company_name) -> tuple[str, str]`
Returns `(title, description)` text for activity events on status changes.

#### `_candidate_next_step_hint(status: ApplicationStatus) -> str`
Returns a human-friendly guidance string for each application status. Shown to candidates on their application detail page.

#### `_company_applications_cache_key(company_id, job_id, page, size) -> str`
Builds a deterministic Redis cache key for company application list queries.

#### `_company_candidates_cache_key(company_id, job_id, status_filter, page, size) -> str`
Builds a deterministic Redis cache key for company candidate list queries.

#### `_company_candidate_detail_cache_key(company_id, application_id) -> str`
Builds the Redis key for a specific candidate detail view.

#### `_build_share_settings(payload: ApplyRequest) -> CandidateShareSettings`
Derives share settings from the application request. If `share_profile_all=True`, all individual flags are set to True regardless of their values in the payload. Email is always shared.

#### `_application_share_settings(application: Application) -> CandidateShareSettings`
Reads share settings from a persisted Application instance. Same all-or-nothing logic as `_build_share_settings`.

#### `_application_response_options() -> list`
Returns SQLAlchemy eager-load options for building a full `ApplicationResponse` (resume + experiences, educations, skills).

#### `_get_outreach_audit_items(db, application_id) -> list[ApplicationOutreachAuditItem]`
Fetches all `EmailDraft` records for an application to build the outreach audit trail.

#### `_build_shared_profile_snapshot(user, profile, share_settings) -> dict`
Constructs the `shared_*` column values to store on the application at submission time. Respects each share setting flag.

#### `_background_database_url(db: AsyncSession) -> str`
Extracts the DB URL from the session's engine for passing to background tasks that need their own session.

#### `_job_is_open_for_auto_shortlisting(job: Job) -> bool`
Returns True if the job is `active` and not expired. Used to guard auto-shortlisting triggers.

#### `apply_to_job(db, user, payload, bg_tasks) -> ApplicationResponse`
Submits a job application. Validates: job exists and is active, resume belongs to user, no duplicate application. Builds and stores the share snapshot, creates dual activity events (candidate + recruiter), enqueues Qdrant sync, triggers auto-shortlisting if enabled. Invalidates relevant caches.

#### `_app_to_list_item(app: Application) -> ApplicationListItem`
Maps an `Application` ORM object to `ApplicationListItem` with nested `ApplicantSummary`.

#### `_get_active_company_id(db, user) -> str`
Returns the active company ID for a recruiter/admin. Raises HTTP 403 if no active membership.

#### `list_candidate_applications(db, user_id, page, size) -> list[CandidateApplicationView]`
Returns paginated applications for a candidate with job + company metadata. Cached with 5-minute TTL.

#### `list_company_applications(db, company_id, job_id, page, size) -> list[RecruiterApplicationView]`
Returns applications for a company inbox, optionally filtered to one job. Cached with 3-minute TTL + jitter.

#### `list_company_candidates(db, user, job_id, status_filter, page, size) -> list[RecruiterCandidateListItem]`
Returns candidates grouped by `user_id` (not by application). Each candidate includes a list of all their applications. Sorted by latest activity. Cached with 3-minute TTL + jitter.

#### `get_company_candidate_detail(db, user, application_id) -> RecruiterCandidateDetailView`
Returns full recruiter-safe candidate detail for one application. Enforces company ownership. Respects share settings. Includes interview, timeline, and outreach audit. Cached with 3-minute TTL + jitter.

#### `list_user_applications(db, user, page, size) -> list[CandidateApplicationView]`
Thin wrapper over `list_candidate_applications` for the authenticated user.

#### `list_job_applications(db, user, job_id, page, size) -> list[RecruiterApplicationView]`
Lists applications for a specific job after verifying it belongs to the recruiter's company.

#### `list_my_company_applications(db, user, job_id, page, size) -> list[RecruiterApplicationView]`
Lists applications for the recruiter's company. Optionally scoped to one job with ownership verification.

#### `get_application(db, user, application_id) -> ApplicationResponse`
Fetches a single application. Candidates can see their own; active company members can see applications for their company's jobs. Raises HTTP 403 otherwise.

#### `get_application_timeline(db, user, application_id) -> list[ActivityEventResponse]`
Returns the event timeline for an application scoped to the correct audience (candidate or recruiter).

#### `get_company_candidate_timeline(db, user, application_id) -> list[ActivityEventResponse]`
Returns the recruiter-scoped timeline for a candidate application after access check.

#### `update_application_status(db, user, application_id, payload, bg_tasks) -> ApplicationResponse`
Updates application status (active company members only). Enforces valid status transitions (e.g. shortlist/reject requires job to be expired; offer requires interview_completed). Sends email for shortlisted/rejected/offer. Fires dual activity events. Enqueues Qdrant sync. Invalidates caches.

#### `update_application_review(db, user, application_id, payload, bg_tasks) -> ApplicationResponse`
Updates manual score and/or feedback. Active company members only, job must belong to their company. Fires dual activity events. Enqueues Qdrant sync. Invalidates caches.

#### `respond_to_offer(db, application_id, accepted, user) -> None`
Candidate accepts or declines an offer. Application must be at `offer` status and belong to the user. Sets status to `offer_accepted` or `offer_declined`. Fires dual activity events and sends confirmation email.

---

### `app/modules/applications/schemas.py`

#### `ApplyRequest`
Request body for submitting an application. Requires `job_id` and `resume_id`. Privacy flags default to fully shared.

#### `UpdateApplicationStatusRequest`
Request body for recruiter status updates. Valid values: `shortlisted`, `rejected`, `interview_completed`, `offer`.

#### `UpdateApplicationReviewRequest`
Request body for updating score and/or feedback. Both fields are optional but at least one must be provided.

#### `CandidateApplicationView`
Candidate-facing application row for dashboard and applications list.

#### `RecruiterApplicationView`
Recruiter-facing application row for company inbox and job applicants list.

#### `RecruiterCandidateListItem`
Recruiter-facing candidate row. Groups all applications from one candidate under a single entry.

#### `RecruiterCandidateDetailView`
Full recruiter-safe candidate profile for one application. Only contains fields the candidate opted to share.

#### `ApplicationOutreachAuditItem`
Audit trail entry for an outreach email draft associated with an application.

---

### `app/modules/applications/sync.py`

#### `enqueue_application_sync_event(db, application_id, action) -> ApplicationSyncEvent`
Creates and adds a `ApplicationSyncEvent` to the session (does not flush). Default action: `UPSERT`.

#### `enqueue_application_sync_events(db, application_ids, action) -> list[ApplicationSyncEvent]`
Batch version of `enqueue_application_sync_event`.

#### `process_sync_event(event_id: uuid.UUID) -> None`
Processes one outbox event in a new session.
- `UPSERT`: loads application + job + resume (eagerly), calls `qdrant_service.upsert_application`. If no DB row found, calls `delete_application` instead.
- `DELETE`: calls `qdrant_service.delete_application`.
- Marks event `COMPLETED` on success, `FAILED` on exception.

#### `process_pending_events() -> None`
Sweeps the outbox for up to 50 `PENDING` or `FAILED` events (oldest-first) and processes each. Used by the sync daemon loop.

---

## Modules — Auth

### `app/modules/auth/dependencies.py`

#### `get_optional_user(token, db) -> User | None`
FastAPI dependency. Returns the authenticated user if a valid Bearer token is present; returns `None` otherwise. Does not raise. Used for public endpoints that optionally customise output for logged-in users.

#### `get_current_user(token, db) -> User`
FastAPI dependency. Validates the Bearer token and returns the authenticated user. Raises HTTP 401 if the token is invalid or the user doesn't exist. Binds actor to request context.

#### `get_verified_user(user) -> User`
Dependency. Extends `get_current_user`. Raises HTTP 403 if email is not verified.

#### `require_candidate(user) -> User`
Dependency. Raises HTTP 403 if the user's role is not `candidate`.

#### `require_recruiter(user) -> User`
Dependency. Raises HTTP 403 if the user's role is not `recruiter`.

#### `require_recruiter_admin(user) -> User`
Dependency. Raises HTTP 403 if the user's role is not `recruiter_admin`.

#### `require_recruiter_privileges(user) -> User`
Dependency. Allows both `recruiter` and `recruiter_admin`. Use for job management and dashboard endpoints.

#### `require_active_membership(user, db) -> User`
Dependency. Extends `require_recruiter_privileges`. Raises HTTP 403 if the recruiter's company membership is not `active`. Use on endpoints that must block pending/rejected recruiters.

#### `require_admin(user) -> User`
Dependency. Raises HTTP 403 if the user's role is not `admin`.

---

### `app/modules/auth/models.py`

#### `User` (ORM model)
Core user record. Supports both email/password and OAuth (Google). Privacy fields: `is_email_verified`, `is_onboarded`, `is_deleted`. Role stored in `primary_role`.

#### `OAuthAccount` (ORM model)
Links a user to a third-party OAuth provider account. Unique per `(provider, provider_account_id)`.

#### `RefreshToken` (ORM model)
Persists refresh token JTIs for revocation checking. Each JTI is unique. Expired tokens are pruned on login.

---

### `app/modules/auth/service.py`

#### `invalidate_user_read_caches(db, user) -> None`
Clears profile and company dashboard caches when user data changes.

#### `get_me_data(db, user) -> UserResponse`
Returns the authenticated user's profile enriched with their membership status.

#### `update_me_data(db, user, payload) -> UserResponse`
Updates the user's `full_name`. Creates an audit log entry. Returns the updated profile.

#### `change_password(db, user, payload) -> None`
Validates the current password (if one exists), updates the hash, and revokes all refresh tokens. Forces re-login on all devices.

#### `signup(db, payload, bg_tasks) -> SignupData`
Validates email uniqueness. For candidates: creates a `pending_candidate` token and sends the verification email immediately. For recruiters/admins: creates a `setup` token and returns it — no email sent yet (awaits company setup step).

#### `verify_email(db, payload) -> None`
Decodes the pending-signup JWT from the email link. Creates the user record. If the token type is `pending_company`, also creates the company and admin membership. If `pending_recruiter`, finds the company and creates a pending membership. Idempotent — duplicate clicks are silently ignored.

#### `login(db, payload, response) -> dict`
Validates credentials, checks email verification and soft-delete status. Purges expired refresh tokens. Creates new token pair, sets `refresh_token` in httpOnly cookie, persists JTI, logs the session. Returns access token + user data.

#### `google_register(db, payload, response) -> dict`
Completes Google OAuth registration. For recruiters/admins: defers user creation, returns a `setup` token. For candidates: creates the user, links the OAuth account, creates tokens, and returns them.

#### `login_swagger(db, payload) -> dict`
OAuth2 password flow endpoint for Swagger UI. Returns `{access_token, token_type}` directly.

#### `refresh_tokens(db, refresh_token, response) -> dict`
Validates the refresh token JTI against the DB (revocation check). Rotates: deletes old JTI, creates new token pair, updates cookie. Returns new access token.

#### `logout(db, refresh_token, response) -> dict`
Revokes the JTI from the DB and clears the refresh cookie. Handles already-logged-out sessions gracefully.

#### `forgot_password(db, payload, bg_tasks) -> dict`
Generates a secure reset token, sets it on the user with a 1-hour expiry, and queues the reset email. Returns a generic message regardless of whether the email exists (prevents enumeration).

#### `reset_password(db, payload) -> dict`
Validates the reset token and expiry, updates the password hash, clears the token fields, and revokes all refresh tokens. Forces re-login everywhere.

#### `delete_my_account(db, user, response) -> None`
Soft-deletes the user (sets `is_deleted=True`, records `deleted_at`). Revokes all refresh tokens and clears the auth cookie.

---

### `app/modules/auth/utils.py`

#### `get_membership_status(db, user) -> MembershipStatus | None`
Returns the most recent company membership status for recruiters/admins. Returns `None` for candidates and other roles.

#### `build_user_dict(db, user) -> dict`
Returns a serialisable dict of user fields including membership status. Used in login and registration responses.

---

### `app/modules/auth/oauth.py`

#### `get_google_auth_url(csrf_token: str) -> str`
Builds the Google OAuth 2.0 authorisation URL with `openid email profile` scopes. Uses the raw CSRF token as the `state` param.

#### `exchange_google_code(code: str) -> dict`
Exchanges an authorisation code for Google access and ID tokens. Raises on HTTP errors.

#### `get_google_user_info(access_token: str) -> dict`
Calls the Google userinfo endpoint and returns the user profile dict (`sub`, `email`, `name`, `picture`).

#### `google_oauth_callback(db, code, response) -> dict`
Handles the full Google OAuth callback:
- Existing user → logs in immediately, links OAuth account if new, returns `{"action": "login", ...}`.
- New user → does NOT write to DB, returns `{"action": "signup", "signup_token": ..., "user_info": ...}`.

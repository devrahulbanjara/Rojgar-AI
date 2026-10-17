# ConvexHire persona simulation — AI hiring audit harness

API/in-process persona simulation, in the spirit of UXAgent / TinyTroupe / OASIS, but without a
browser, so a full audit costs cents. It answers three questions a hiring-AI buyer (or regulator)
will ask:

| mode | question | how |
|---|---|---|
| `fairness` | Does the score change when *only* a protected/proxy attribute changes? | Counterfactual variants pushed through the **real** scoring code in-process |
| `redteam` | Can a resume manipulate or break the AI? Does the guardrail block honest people? | Adversarial resumes through the production guardrail, ML bouncer and gap-analysis LLM |
| `load` | What happens when a real cohort (e.g. a campus drive) shows up at once? | N async persona journeys over HTTP |
| `limiter-check` | Is the login limiter keyed correctly? | 11 same-IP logins, then 3 with forged `X-Forwarded-For` |

Nothing here re-implements scoring. The harness hands production functions
(`ml_bouncer.score_applications`, `applications.service._compute_resume_embedding`,
`jobs.service._compute_and_store_jd_embedding`, the gap-analysis provider + grounding filter,
`guardrails_service.check_input`, the compiled LangGraph shortlisting workflow) attribute-compatible
stand-in objects, and records a hash of every scorer input so "the attribute never reached the
model" is provable, not assumed.

## Safety rails

- In-process modes refuse to run unless `settings.db_host` and Qdrant are localhost and `environment != prod`.
- HTTP modes refuse non-localhost URLs unless `--allow-remote` (prints a loud warning). Never point at production.
- `load` against `:8000` (a server a human may be using) is capped at 25 personas and read-only; heavier runs need your own instance (below).
- `limiter-check` refuses `:8000` (the login bucket is shared with whoever else is on that server).
- Load journeys authenticate with access tokens minted in-process (`app.core.security.create_tokens`), so they do not burn the login limiter; `--login-sample N` adds N real, spaced logins to measure login latency.
- Every LLM-using mode prints an estimate, needs `--yes` above $0.50, and aborts past `--max-cost` (default $2).
- Groq calls are serialised with 429 backoff (on-demand tier: 8k tokens/min); uncached Gemini embeddings are paced to ≤30/min with 429 backoff (free tier: 100 req/min, possibly shared with a live deployment). Embeddings are cached on disk under `reports/.cache/`.
- LangSmith tracing is off unless `--trace`.

## Run

From `backend/` with the local stack up (Postgres :5433, Qdrant :6335):

```bash
# Stage-1 ML audit, 8 base resumes + 8 off-target (borderline) pairings, ~$0.01
uv run python -m simulation fairness --bases 8

# + resume-gap LLM (Groq) and stage-2 CTO/HR review (Bedrock); small, confirmed spend
uv run python -m simulation fairness --bases 2 --no-cross --with-llm --llm-bases 2 --review-bases 1 --yes --max-cost 1

# Adversarial resumes (guardrail runs twice each to expose non-determinism)
uv run python -m simulation redteam --repeats 2 --with-llm

# Light load against the shared dev server
uv run python -m simulation load --personas 25

# Heavy load: run your OWN backend on an isolated DB + Qdrant collection first
export DB_NAME=convexhire_test_sim QDRANT_COLLECTION_NAME=sim_convexhire \
       QDRANT_CANDIDATE_COLLECTION_NAME=sim_candidate_applications REDIS_ENABLED=false
uv run alembic upgrade head && uv run python seed_data.py && uv run python scripts/seed_e2e.py
git checkout -- credentials.json            # seed_data.py rewrites this tracked file
uv run python reconcile_vectors.py --force
uv run uvicorn main:app --port 8002 &
uv run python -m simulation load --base-url http://localhost:8002 --db-name convexhire_test_sim \
    --personas 200 --ramp-seconds 10 --mutate
uv run python -m simulation limiter-check --base-url http://localhost:8002
```

Reports (`.md` + `.json`) land in `simulation/reports/` (gitignored); a reference run is committed
in `simulation/reports/sample/`.

## Reading the fairness report

- **impact ratio** = group selection rate ÷ best group's rate; < 0.8 fails the four-fifths rule (NYC LL144-style).
- **ML input identical** = share of variants whose bouncer input hash equals the reference. 1.0 means the
  attribute provably never reached the model.
- **flip vs ref** = share of variants whose shortlist decision differs from the unchanged resume.
- LLM sections report the **noise floor** (same input repeated) next to group deltas; a delta smaller than the
  noise floor is not evidence of bias.

## Limits

- Stand-in objects mean ORM lazy-loading paths are not exercised (the HTTP load mode covers those).
- Base resumes come from `seed_data.py` (synthetic, Nepal IT); conclusions are about the scorer's behaviour, not population outcomes.
- Group labels are coarse auditing buckets inferred from surnames/hometowns, not claims about individuals.

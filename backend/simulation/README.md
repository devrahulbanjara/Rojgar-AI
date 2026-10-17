# Rojgar AI persona simulation — AI hiring audit harness

API/in-process persona simulation, in the spirit of UXAgent / TinyTroupe / OASIS, but without a
browser, so a full audit costs cents. It answers three questions a hiring-AI buyer (or regulator)
will ask:

| mode | question | how |
|---|---|---|
| `fairness` | Does the fit a recruiter sees change when *only* a protected/proxy attribute changes? | Counterfactual variants (tech and non-tech jobs, CVs and Nepali answers) pushed through the **real** blind review, triage and rubric in-process |
| `redteam` | Can a CV manipulate the review? Does the injection rail flag honest people? | Adversarial CVs through the production rail (normalised, fail-closed), review and ML tie-break |
| `load` | What happens when a real cohort (e.g. a campus drive) shows up at once? | N async persona journeys over HTTP |
| `limiter-check` | Is the login limiter keyed correctly? | 11 same-IP logins, then 3 with forged `X-Forwarded-For` |

Nothing here re-implements the review. The harness hands production functions
(`review.blind.build_blind_text`, `review.service._evaluate` — knockouts, cheap
pass, full evidence review, quote verification, deterministic fit —
`review.ml_rank.score_applications`, `review.ml_rank.compute_resume_embedding`,
`review.ml_rank.compute_job_embedding`, `guardrails_service.check_input`)
attribute-compatible stand-in objects, and hashes every reviewer and ML input so
"the attribute never reached the model" is provable, not assumed. Without
`--with-llm` the review uses the deterministic `FakeReviewer` (same triage and
rubric code, no LLM); with it, the live Groq reviewer at temperature 0.

## Safety rails

- In-process modes refuse to run unless `settings.db_host` and Qdrant are localhost and `environment != prod`.
- HTTP modes refuse non-localhost URLs unless `--allow-remote` (prints a loud warning). Never point at production.
- `load` against `:8000` (a server a human may be using) is capped at 25 personas and read-only; heavier runs need your own instance (below).
- `limiter-check` refuses `:8000` (the login bucket is shared with whoever else is on that server).
- Load journeys authenticate with access tokens minted in-process (`app.core.security.create_tokens`), so they do not burn the login limiter; `--login-sample N` adds N real, spaced logins to measure login latency.
- Every LLM-using mode prints an estimate, needs `--yes` above $0.50, and aborts past `--max-cost` (default $2).
- Groq calls are serialised with 429 backoff (on-demand tier: 8k tokens/min). The rail is fail-closed: a classifier error is never SAFE; the harness retries it and reports retries and still-unavailable runs. Uncached Gemini embeddings are paced to ≤30/min with 429 backoff. Embeddings are cached on disk under `reports/.cache/`.
- LangSmith tracing is off unless `--trace`.

## Run

From `backend/` with the local stack up (Postgres :5433, Qdrant :6335):

```bash
# Blind-review audit: 8 tech bases + 8 off-target pairings + 5 non-tech cases, no LLM, ~$0.01
uv run python -m simulation fairness

# + live Groq review on one base (reference repeated for the noise floor); a few cents
uv run python -m simulation fairness --bases 2 --no-cross --with-llm --llm-bases 1 --yes --max-cost 1

# Adversarial CVs (rail runs twice each to expose non-determinism)
uv run python -m simulation redteam --repeats 2 --yes

# Light load against the shared dev server
uv run python -m simulation load --personas 25

# Heavy load: run your OWN backend on an isolated DB + Qdrant collection first
export DB_NAME=convexhire_test_sim \
       QDRANT_CANDIDATE_COLLECTION_NAME=sim_candidate_applications REDIS_ENABLED=false
uv run alembic upgrade head && uv run python seed_data.py && uv run python scripts/seed_e2e.py
git checkout -- credentials.json            # seed_data.py rewrites this tracked file
uv run python scripts/reindex_embeddings.py
uv run uvicorn main:app --port 8002 &
uv run python -m simulation load --base-url http://localhost:8002 --db-name convexhire_test_sim \
    --personas 200 --ramp-seconds 10 --mutate   # --mutate: decide + undo (no email sent)
uv run python -m simulation limiter-check --base-url http://localhost:8002
```

Reports (`.md` + `.json`) land in `simulation/reports/` (gitignored).

## Reading the fairness report

- **reviewer input identical** = share of variants whose blind review text equals the reference. 1.0 means
  the attribute provably never reached the reviewer, so the fit cannot depend on it.
- **selection rate** = share with fit strong or possible; **impact ratio** = group rate ÷ best group's rate;
  < 0.8 fails the four-fifths rule (NYC LL144-style).
- **fit flip vs ref** = share of variants whose fit bucket differs from the unchanged application.
- **ML Δ** = change in the tie-break signal (points of 100). It only orders candidates with equal rubric
  evidence inside a bucket; the self-reported years feature is a fixed constant, so the years curve is flat.
- Live-review sections report the **noise floor** (same input repeated) next to variant flips.

## Limits

- Stand-in objects mean ORM lazy-loading paths are not exercised (the HTTP load mode covers those).
- Base cases come from `seed_data.py` (synthetic Nepal IT, banking, healthcare, retail, logistics and
  hospitality applicants); conclusions are about the reviewer's behaviour, not population outcomes.
- The deterministic reviewer is a word-overlap stand-in: it proves blindness and the rubric/triage code,
  not the live model's judgement. Use `--with-llm` for that.
- Group labels are coarse auditing buckets inferred from surnames/hometowns, not claims about individuals.

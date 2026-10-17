# Handover (2026-10-17)

The current status, how to deploy, and what's left. Setup and commands are in `README.md`; rules are in `AGENTS.md`.

## Status

- All work is on `main` at `github.com/devrahulbanjara/Rojgar-AI`. There are no other active branches.
- CI is green: backend tests, the backend Docker image, and frontend types, lint and build.
- Vercel fails on purpose until a backend is deployed (see below).
- The local stack: Postgres :5433, Qdrant :6335, Redis :6380, API :8000, web :3000. Seed logins are in the README.

## Deploying

**Deploy the backend first, then the frontend.** The frontend build refuses to ship while `NEXT_PUBLIC_BACKEND_URL` points at `localhost`. A site like that would call each visitor's own computer, so every page would be empty.

1. **Backend:**
   - Build `backend/Dockerfile` (for example as a Render web service).
   - On every start, the entrypoint runs `alembic upgrade head` against the configured database. Back up the production database before the first deploy.
   - Two migrations stop if two emails, or two business names, differ only by capital letters. Clean those rows up first.
2. **Backend environment** (see `backend/.env.example`):
   - `ENVIRONMENT=prod` and `TRUSTED_PROXY_HOPS=1` (behind Render).
   - `SECRET_KEY`, `FRONTEND_URL`, `BACKEND_URL`.
   - `DB_*`, `REDIS_URL` with `REDIS_ENABLED=true`, `QDRANT_URL`, `QDRANT_API_KEY`.
   - `SMTP_*`, `MAIL_FROM`.
   - `GROQ_API_KEY`, `TAVILY_API_KEY`.
   - `CLOUDINARY_URL` (in prod, storage uses Cloudinary automatically).
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (`<BACKEND_URL>/auth/google/callback`).
   - Optional: `TURNSTILE_SECRET`, plus the Bedrock or LlamaCloud keys.
3. **Embedding model:**
   - On first use, the backend downloads `multilingual-e5-small` (ONNX) into `MODEL_CACHE_DIR`, so the first review after a fresh start is slower.
   - Give the service enough memory: 512 MB is tight. Use 1 GB.
4. **Frontend:** in Vercel, set `NEXT_PUBLIC_BACKEND_URL` (the backend's public https address) and `NEXT_PUBLIC_SITE_URL`, then redeploy. Every push to `main` deploys.
5. **Smoke test:**
   - Sign in.
   - Post a job.
   - Apply from the public link in a private window.
   - Check the review appears.
   - Shortlist the applicant and undo.
   - Open the CV link.

## Owner actions (only you can do these)

- **Rotate every secret that was pasted in chat:** AWS keys, Supabase DB password, Gmail app password, Google OAuth secret, Groq, Gemini, Tavily, LlamaCloud, LangSmith, Upstash, Qdrant, Cloudinary.
- **Decide on the git history.**
  - `backend/credentials.json` (seeded accounts, password `Password@123`) is deleted and gitignored, but it's still in 6 old commits.
  - To purge it: `git filter-repo --path backend/credentials.json --invert-paths`, then force-push. This rewrites history.
  - Re-password any seeded accounts that exist in production.
- **Groq:** the free tier (about 8k tokens a minute, plus a daily cap) runs out under light load. Use a paid tier before launch.
- **Terms:** `/terms` promises a refund within 7 days of paying. Keep or change it before taking payments.
- **Landing photos:** `components/public/landing/ApplicantsPreview.tsx` uses Unsplash portraits. Keep them or replace them with illustrations.
- **Talk to employers** before launch (hotels, clinics, schools, shops, banks): how many applicants per post, who decides, and what they would pay.

## What's left

### Fix

- **Uploads inside a database transaction.** Guest apply, quick add and business registration documents upload to Cloudinary while a DB transaction is open. Move the upload before the transaction, and delete the file if the write fails. This is the async rule in AGENTS.md.
- **Quick add with a photo CV** is not marked "photo, not read yet" the way guest apply is.
- **Repeated evidence.** The review sometimes uses the same CV sentence as proof for several must-haves. Require a different quote for each check, or show one quote once.
- **Playwright suite** (`frontend/e2e`): written before the data model and login changes. Run `npm run e2e` and fix or delete stale specs.

### Clean up

- Remove smooth scrolling: `providers/LenisProvider.tsx` and the `lenis` and `gsap` packages.
- `globals.css`: SCSS is gone, so remove the comments about it, the `important` flag on utilities and the per-folder `@source` list. Then update the Tailwind rule in AGENTS.md.
- **Settings:** a few `Settings` fields are still read nowhere. Check each against `.env.example` and CI, and delete it or move it to `app/core/constants.py`.

### Build

- **Payments:** eSewa, Khalti and Fonepay, plus an IRD-format VAT bill (13%). Until then, the platform admin records payments in `/admin`.
- **SMS is off.** It stays off until there's budget. To turn it on: `SMS_ENABLED=true`, `SMS_PROVIDER=sparrow`, plus the Sparrow token and sender. Plans already list SMS as a feature; check PRICING.md before turning it on.
- **Final walkthrough:** in the browser at 1440 and 390 px, go through every page once as each role: owner, manager, interviewer, applicant, platform admin.

## Decisions to keep

- The customers are small and medium businesses in Nepal of every kind, not just IT.
- There's one apply link per job and no job board. Applicants need no account and never pay.
- AI reviews against the job's must-haves with quotes. It never moves or rejects anyone, and there is no AI interview scoring.
- A CV is required per job, with a smart default by category (off for jobs where many people have no CV).
- Applicants hear back by email. SMS stays off.
- Files are on Cloudinary:
  - CVs and documents are private and open through short-lived signed links;
  - uploads go through the backend.
- Avatars are a photo or generated initials.
- Embeddings run locally (`multilingual-e5-small`), so there's no embedding API.
- Interview video links use Jitsi Meet.

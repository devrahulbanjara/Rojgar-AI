# Testing Guide — ConvexHire API

This document covers how to set up, run, and understand the test suite for the ConvexHire backend.

---

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [What Is Tested](#what-is-tested)
- [Test Helpers](#test-helpers)
- [Notes & Conventions](#notes--conventions)

---

## Overview

The test suite uses **integration tests** — each test spins up the full FastAPI application against a real PostgreSQL test database. There are no mocks for the database layer. This means when a test passes, you can be confident the full request → service → database → response chain is working correctly.

**Stack:** `pytest` · `pytest-asyncio` · `httpx (AsyncClient)` · `SQLAlchemy async`

**Total tests:** ~80 across 7 modules.

---

## Setup

### 1. Create a test database

The test suite uses a separate database so it never touches your development data.

```bash
createdb convexhire_test
```

### 2. Configure environment variables

Add the following to your `.env` file (alongside your existing dev DB variables):

```env
TEST_DB_USER=your_db_user
TEST_DB_PASSWORD=your_db_password
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=convexhire_test
```

### 3. Install dependencies

```bash
uv sync
```

---

## Running Tests

### Run the full test suite

```bash
pytest tests/ -v
```

### Run a specific test file

```bash
# Original tests (signup, basic RBAC)
pytest tests/test_auth.py -v
pytest tests/test_jobs.py -v
pytest tests/test_rbac.py -v

# Full integration suite
pytest tests/test_integration.py -v
```

### Run a specific test class

```bash
pytest tests/test_integration.py::TestApplicationSubmit -v
```

### Run a single test

```bash
pytest tests/test_integration.py::TestApplicationSubmit::test_candidate_can_apply_to_open_job -v
```

### Run with short output (no verbose)

```bash
pytest tests/
```

### Stop on first failure

```bash
pytest tests/ -x
```

### Show print output / logs

```bash
pytest tests/ -s
```

---

## Test Structure

```
tests/
├── conftest.py           # Shared fixtures: DB engine, session, HTTP client
├── test_auth.py          # Basic signup and validation tests
├── test_jobs.py          # Recruiter job posting test
├── test_rbac.py          # Role-based access control smoke test
└── test_integration.py   # Full integration suite (all modules)
```

### `conftest.py` — Shared Fixtures

| Fixture | Scope | Purpose |
|---|---|---|
| `disable_emails` | session | Sets `send_emails = False` — prevents real emails during tests |
| `engine` | session | Creates the async engine, runs `CREATE TABLE` on startup, `DROP TABLE` on teardown |
| `db` | function | Fresh DB session per test with automatic rollback |
| `client` | function | `httpx.AsyncClient` wired to the FastAPI app with the test DB injected |

> **Important:** The `db` fixture rolls back after every test, but because the test database tables persist for the session, any committed data from one test can be visible to another if they share state. Each test creates its own uniquely-named data (distinct emails, domains) to avoid this.

---

## What Is Tested

### Auth — `TestSignup`, `TestLogin`, `TestGetMe`, `TestTokenRefresh`, `TestForgotPassword`

| Scenario | Expected |
|---|---|
| Candidate signup | 201, no setup token |
| Recruiter / admin signup | 201, setup token returned |
| Duplicate email signup | 409 |
| Password shorter than 8 chars | 400 with field-level error |
| Invalid role value | 400 |
| Login with unverified email | 403 |
| Login with wrong password | 401 |
| Login with non-existent email | 401 |
| `GET /me` with valid token | 200, correct email returned |
| `GET /me` with no token | 401 |
| `GET /me` with invalid token | 401 |
| Recruiter `/me` shows membership status | 200, `membership_status` field present |
| Candidate `/me` has no membership status | 200, `membership_status` is null |
| Refresh without cookie | 401 |
| Forgot password (any email) | 200 — never reveals if email exists |

---

### Companies — `TestCompanyRegister`, `TestJoinCompany`, `TestRecruiterManagement`

| Scenario | Expected |
|---|---|
| Register company with invalid JWT | 401 |
| Register company with candidate-role token | 403 |
| Register company with valid admin token | 201, verification email queued |
| Join non-existent company | 404 |
| Join existing company with valid recruiter token | 201 |
| List recruiters as admin | 200, list returned |
| List recruiters as candidate | 403 |
| Approve pending recruiter | 200, status → `active` |
| Reject pending recruiter | 200, status → `rejected` |
| Remove recruiter from company | 200 |
| Approve membership with fake ID | 404 |

---

### Jobs — `TestJobCreate`, `TestJobRead`, `TestJobUpdate`, `TestJobDelete`

| Scenario | Expected |
|---|---|
| Active recruiter creates job | 201 |
| Candidate creates job | 403 |
| Recruiter with no company creates job | 403 |
| Recruiter with pending membership creates job | 403 |
| `salary_min > salary_max` on create | 400 |
| Public job listing shows only open jobs | 200, draft excluded |
| Get job by ID | 200 |
| Get non-existent job | 404 |
| Search by keyword (`q=`) | 200, correct job returned |
| Search by category | 200, correct job returned |
| Company job list includes drafts (internal) | 200 |
| Candidate accesses `/jobs/company/me` | 403 |
| Recruiter updates own job | 200, field updated |
| Recruiter updates another company's job | 404 (IDOR safe) |
| Draft job published via PATCH, appears in search | 200 → visible |
| Recruiter deletes own job, then GET | 200 → 404 |
| Candidate deletes job | 403 |

---

### Profiles — `TestProfile`

| Scenario | Expected |
|---|---|
| First `GET /profiles/me` creates empty profile | 200, empty collections |
| Recruiter accesses `GET /profiles/me` | 403 |
| Update headline, location, years of experience | 200, fields persisted |
| Update with experiences | 200, experience list returned |
| Second update replaces (not appends) experiences | 200, only new data present |
| Update with skills | 200, skill names returned |
| Get another user's profile by ID | 200 |
| Get profile for non-existent user ID | 404 |
| Unauthenticated access | 401 |

---

### Resumes — `TestResume`

| Scenario | Expected |
|---|---|
| Fork resume from profile copies data | 201, headline and skills copied |
| Fork resume with no profile | 201, blank resume created |
| List my resumes | 200, all names present |
| Get specific resume by ID | 200 |
| Get another user's resume by ID | 404 (IDOR safe) |
| Update resume name | 200, new name persisted |
| Update resume skills | 200, new skills present |
| Delete resume, then GET | 200 → 404 |
| Recruiter accesses resume routes | 403 |

---

### Applications — `TestApplicationSubmit`, `TestApplicationRead`, `TestApplicationStatusUpdate`

| Scenario | Expected |
|---|---|
| Candidate applies to open job | 201, status `submitted` |
| Apply to closed job | 400 |
| Apply to draft job | 400 |
| Apply twice to same job | 409 |
| Apply using another candidate's resume | 403 (IDOR prevented) |
| Recruiter tries to apply | 403 |
| Apply to non-existent job | 404 |
| Candidate lists own applications | 200 |
| Recruiter lists applications for own job | 200 |
| Candidate lists applications for a job | 403 |
| Candidate views own application detail | 200 |
| Other candidate views someone else's application | 403 |
| Recruiter updates application status | 200, status updated |
| Candidate updates application status | 403 |
| Recruiter from different company updates status | 403 |

---

### Dashboards — `TestDashboard`

| Scenario | Expected |
|---|---|
| Candidate accesses candidate dashboard | 200 |
| Recruiter accesses recruiter dashboard | 200 |
| Recruiter accesses candidate dashboard | 403 |
| Candidate accesses recruiter dashboard | 403 |
| Unauthenticated access to any dashboard | 401 |

---

### System — `TestSystem`

| Scenario | Expected |
|---|---|
| `GET /` root endpoint | 200, app name in response |
| `GET /health` database check | 200, `database: connected` |

---

## Test Helpers

`test_integration.py` defines several async helper functions to create database objects directly, bypassing the email verification flow. This keeps tests fast and focused on the behavior being tested, not the signup process.

```python
make_user(db, email, role="candidate", verified=True)
make_company(db, name, domain)
make_membership(db, user, company, role="admin", status="active")
make_job(db, company, posted_by, title, status, category)
make_resume(db, user, name)
auth_headers(user)   # returns {"Authorization": "Bearer <token>"}
```

---

## Notes & Conventions

- **Emails must be unique per test.** Each test uses a descriptive email like `recruiter_approve@test.com` to avoid conflicts between tests.
- **Emails are disabled in all tests.** The `disable_emails` session fixture sets `settings.send_emails = False`, so no real SMTP calls are made.
- **No global shared fixtures for users/companies.** Every test creates exactly what it needs. This avoids hidden dependencies between tests.
- **The test DB schema is created fresh each session.** `Base.metadata.create_all` runs on startup and `drop_all` runs on teardown. You do not need to run migrations against the test DB.
- **IDOR (Insecure Direct Object Reference) cases are explicitly tested.** Any endpoint where a user could access another user's data by guessing an ID has a dedicated test.
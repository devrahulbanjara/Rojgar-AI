"""Migration 2017037b521a (data model v2): up on seeded v1 rows, then down.

Runs the real Alembic chain against a throwaway database next to the test DB.
"""

import asyncio
import uuid

import psycopg2
import pytest
from alembic.config import Config

from alembic import command
from app.core.config import settings

BEFORE, V2 = "b0acfd8bc7d7", "2017037b521a"


def _connect(dbname: str):
    return psycopg2.connect(
        host=settings.test_db_host,
        port=settings.test_db_port,
        user=settings.test_db_user,
        password=settings.test_db_password,
        dbname=dbname,
    )


@pytest.fixture
def scratch_db(monkeypatch):
    name = f"{settings.test_db_name}_mig"
    admin = _connect("postgres")
    admin.autocommit = True
    with admin.cursor() as cur:
        cur.execute(f'DROP DATABASE IF EXISTS "{name}"')
        cur.execute(f'CREATE DATABASE "{name}"')
    for attr in ("user", "password", "host", "port"):
        monkeypatch.setattr(
            settings, f"db_{attr}", getattr(settings, f"test_db_{attr}")
        )
    monkeypatch.setattr(settings, "db_name", name)
    cfg = Config("alembic.ini")
    yield name, cfg
    with admin.cursor() as cur:
        cur.execute(f'DROP DATABASE IF EXISTS "{name}"')
    admin.close()


IDS = {key: str(uuid.uuid4()) for key in ("company", "rec", "cand", "resume")}
JOBS = {k: str(uuid.uuid4()) for k in ("active", "expired", "hired", "draft")}
STATUSES = [
    "applied",
    "shortlisted",
    "interview_booked",
    "interview_completed",
    "offer",
    "offer_accepted",
    "offer_declined",
    "rejected",
]


def _seed_v1(dbname: str) -> dict[str, str]:
    apps: dict[str, str] = {}
    with _connect(dbname) as conn, conn.cursor() as cur:
        cur.execute(
            "INSERT INTO companies (id, name, slug) VALUES (%s, 'Himalayan Bank', 'hbl')",
            (IDS["company"],),
        )
        cur.execute(
            "INSERT INTO users (id, full_name, email, primary_role) VALUES "
            "(%s, 'Rec', 'rec@x.np', 'recruiter_admin'), "
            "(%s, 'Sita', 'sita@x.np', 'candidate')",
            (IDS["rec"], IDS["cand"]),
        )
        cur.execute(
            "INSERT INTO resumes (id, user_id) VALUES (%s, %s)",
            (IDS["resume"], IDS["cand"]),
        )
        cur.execute(
            """INSERT INTO jobs (id, company_id, title, slug, status, overview,
                   responsibilities, requirements, preferred_qualifications, benefits,
                   screening_questions, required_years_of_experience, expires_at,
                   auto_shortlist, shortlist_threshold)
               VALUES (%s, %s, 'Bank Teller', 'teller', 'active', 'Front desk role.',
                   ARRAY['Count cash','Serve customers'],
                   ARRAY['+2 in management','Cash handling','Nepali typing',
                         'Customer service','Computer basics','Honesty','Punctual'],
                   ARRAY['Banking diploma'], ARRAY['Lunch'],
                   ARRAY['Notice period?'], 2, now() + interval '5 days', true, 65)""",
            (JOBS["active"], IDS["company"]),
        )
        cur.execute(
            """INSERT INTO jobs (id, company_id, title, slug, status, expires_at,
                   hiring_completed, hired_at)
               VALUES (%s, %s, 'Cashier', 'cashier', 'expired', now() - interval '1 day',
                       false, NULL),
                      (%s, %s, 'Driver', 'driver', 'active', now() + interval '9 days',
                       true, now() - interval '2 days'),
                      (%s, %s, 'Cook', 'cook', 'draft', NULL, false, NULL)""",
            (
                JOBS["expired"],
                IDS["company"],
                JOBS["hired"],
                IDS["company"],
                JOBS["draft"],
                IDS["company"],
            ),
        )
        for i, status in enumerate(STATUSES):
            user_id = str(uuid.uuid4())
            cur.execute(
                "INSERT INTO users (id, full_name, email, primary_role) "
                "VALUES (%s, %s, %s, 'candidate')",
                (user_id, f"C{i}", f"c{i}@x.np"),
            )
            app_id = str(uuid.uuid4())
            apps[status] = app_id
            cur.execute(
                """INSERT INTO applications (id, job_id, user_id, resume_id, status,
                       score, strengths, weaknesses, ml_bouncer_score,
                       ai_review_status, ai_review_attempts, ai_flag_reason,
                       shortlist_notified, source)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (
                    app_id,
                    JOBS["active"],
                    user_id,
                    IDS["resume"],
                    status,
                    [80, 74, 49, None, 90, 75, 50, 10][i],
                    '["Six years handling cash at a cooperative"]'
                    if i % 2 == 0
                    else None,
                    '["No banking diploma"]' if i == 0 else None,
                    0.42 if i == 0 else None,
                    "needs_human_review"
                    if i == 3
                    else ("completed" if i < 3 else None),
                    i,
                    "Flagged by rail" if i == 3 else None,
                    i == 1,
                    "platform" if i == 2 else "linkedin",
                ),
            )
        cur.execute(
            """INSERT INTO email_drafts (id, application_id, subject, body, is_sent,
                   is_approved, sent_at)
               VALUES (%s, %s, 'Shortlisted', '<p>Hi</p>', true, true, now()),
                      (%s, %s, 'Draft', '<p>unsent</p>', false, false, NULL)""",
            (
                str(uuid.uuid4()),
                apps["shortlisted"],
                str(uuid.uuid4()),
                apps["rejected"],
            ),
        )
        cur.execute(
            """INSERT INTO interviews (id, application_id, cal_booking_uid,
                   candidate_name, candidate_email, start_time, end_time)
               VALUES (%s, %s, 'cal-1', 'C2', 'c2@x.np', now(), now() + interval '1 hour')""",
            (str(uuid.uuid4()), apps["interview_booked"]),
        )
    return apps


def _rows(dbname: str, sql: str, *args) -> list[tuple]:
    with _connect(dbname) as conn, conn.cursor() as cur:
        cur.execute(sql, args)
        return cur.fetchall()


def _snapshot_v1(dbname: str) -> dict:
    return {
        "apps": _rows(
            dbname,
            "SELECT id, status::text, score, strengths, weaknesses, ml_bouncer_score, "
            "ai_review_status, ai_review_attempts, ai_flag_reason, shortlist_notified, "
            "source FROM applications ORDER BY id",
        ),
        "jobs": _rows(
            dbname,
            "SELECT id, status::text, overview, responsibilities, requirements, "
            "preferred_qualifications, benefits, screening_questions, "
            "required_years_of_experience, hiring_completed FROM jobs ORDER BY id",
        ),
    }


async def test_upgrade_maps_rows_and_downgrade_restores_them(scratch_db):
    name, cfg = scratch_db
    await asyncio.to_thread(command.upgrade, cfg, BEFORE)
    apps = _seed_v1(name)
    before = _snapshot_v1(name)

    await asyncio.to_thread(command.upgrade, cfg, V2)

    stage = dict(_rows(name, "SELECT id::text, stage::text FROM applications"))
    assert {s: stage[apps[s]] for s in STATUSES} == {
        "applied": "new",
        "shortlisted": "shortlisted",
        "interview_booked": "interview",
        "interview_completed": "interview",
        "offer": "offer",
        "offer_accepted": "hired",
        "offer_declined": "withdrawn",
        "rejected": "rejected",
    }
    reviews = {
        row[0]: row[1:]
        for row in _rows(
            name,
            "SELECT application_id::text, state, fit, summary, flag_reason "
            "FROM application_reviews",
        )
    }
    assert len(reviews) == len(STATUSES)
    assert reviews[apps["applied"]] == (
        "done",
        "strong",
        "Six years handling cash at a cooperative",
        None,
    )
    assert reviews[apps["shortlisted"]][:2] == ("done", "possible")  # 74
    assert reviews[apps["interview_booked"]][:2] == ("done", "weak")  # 49
    assert reviews[apps["interview_completed"]] == (
        "needs_person",
        None,
        None,
        "Flagged by rail",
    )
    events = _rows(
        name,
        "SELECT application_id::text, type, payload FROM application_events",
    )
    by_type: dict[str, list] = {}
    for app_id, kind, payload in events:
        by_type.setdefault(kind, []).append((app_id, payload))
    assert len(by_type["applied"]) == len(STATUSES)
    assert [a for a, _ in by_type["interview_done"]] == [apps["interview_completed"]]
    assert [p["note"] for _, p in by_type["stage_changed"]] == ["declined offer"]
    assert [a for a, _ in by_type["email_sent"]] == [apps["shortlisted"]]
    assert [a for a, _ in by_type["interview_booked"]] == [apps["interview_booked"]]
    sources = dict(_rows(name, "SELECT id::text, source FROM applications"))
    assert sources[apps["interview_booked"]] == "direct"  # was "platform"

    jobs = {
        row[0]: row[1:]
        for row in _rows(
            name,
            "SELECT id::text, status::text, closed_reason, description, must_haves, "
            "nice_to_haves, questions, closes_at IS NOT NULL FROM jobs",
        )
    }
    status, reason, description, must, nice, questions, has_close = jobs[JOBS["active"]]
    assert (status, reason, has_close) == ("open", None, True)
    assert description.startswith(
        "Front desk role.\n\n## Responsibilities\n- Count cash"
    )
    assert "## Requirements\n- +2 in management" in description
    assert "- Punctual" in description  # all requirements kept in the text
    assert must == [
        "2+ years of relevant experience",
        "+2 in management",
        "Cash handling",
        "Nepali typing",
        "Customer service",
        "Computer basics",
    ]
    assert nice == ["Banking diploma"]
    assert questions == [
        {"label": "Notice period?", "type": "short_text", "required": True}
    ]
    assert jobs[JOBS["expired"]][:2] == ("closed", "expired")
    assert jobs[JOBS["hired"]][:2] == ("closed", "hired")
    assert jobs[JOBS["draft"]][:2] == ("draft", None)

    await asyncio.to_thread(command.downgrade, cfg, BEFORE)
    after = _snapshot_v1(name)
    assert after["apps"] == before["apps"]
    # Hired jobs come back expired + hiring_completed; everything else exact.
    expected_jobs = [
        (row[0], "expired", *row[2:]) if row[0] == JOBS["hired"] else row
        for row in before["jobs"]
    ]
    assert [r[:2] + r[2:] for r in after["jobs"]] == [tuple(r) for r in expected_jobs]
    drafts = _rows(name, "SELECT application_id::text, is_sent FROM email_drafts")
    assert drafts == [(apps["shortlisted"], True)]  # unsent drafts are not restored

    # And forward again on the restored data.
    await asyncio.to_thread(command.upgrade, cfg, V2)

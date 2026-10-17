"""Refresh the seeded demo so time-based screens always have something to show.

seed_data.py writes fixed dates, so after a day "Today" is empty and nothing is
closing soon. This moves F1Soft's demo data relative to now: interviews today
and tomorrow, a job closing in 2 days, AI reviews awaiting a recruiter, a
flagged CV, applicants waiting over 5 days, and unsent outreach drafts.

Idempotent and local-only. Run after seed_data.py, and again any day:
    uv run python scripts/seed_demo_refresh.py
"""

import asyncio
import sys
from datetime import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text

from app.core.database import engine
from app.core.destructive_guard import assert_local_target

COMPANY = "F1Soft%"
CANDIDATE_EMAIL = "aashish.basnet@gmail.com"
RECRUITER_EMAIL = "priya.maharjan@f1soft.com"
MEET_LINK = "https://meet.google.com/demo-f1soft-int"

# Kathmandu wall-clock times for interviews today and tomorrow.
TODAY_SLOTS = ["10:30", "15:00"]
TOMORROW_SLOTS = ["11:00", "14:00"]


async def refresh() -> None:
    async with engine.begin() as conn:
        company_id = await conn.scalar(
            text("SELECT id FROM companies WHERE name ILIKE :n LIMIT 1"), {"n": COMPANY}
        )
        if company_id is None:
            sys.exit("F1Soft not found — run seed_data.py first.")

        # Interviews: spread booked interviews over today, tomorrow and later,
        # with the candidate's own interview tomorrow morning.
        booked = (
            await conn.execute(
                text(
                    """
                    SELECT a.id, u.full_name, u.email, j.title
                    FROM applications a
                    JOIN jobs j ON j.id = a.job_id
                    JOIN users u ON u.id = a.user_id
                    WHERE j.company_id = :c AND a.status = 'interview_booked'
                    ORDER BY (u.email = :cand) DESC, a.created_at
                    """
                ),
                {"c": company_id, "cand": CANDIDATE_EMAIL},
            )
        ).all()
        slots = [(1, TOMORROW_SLOTS[0])] + [(0, s) for s in TODAY_SLOTS]
        slots += [(1, TOMORROW_SLOTS[1])] + [
            (d, "11:00") for d in range(2, 2 + len(booked))
        ]
        for (app_id, name, email, title), (day, hhmm) in zip(booked, slots):
            start_sql = (
                "((date_trunc('day', now() AT TIME ZONE 'Asia/Kathmandu') "
                "+ make_interval(days => :d) + CAST(:t AS time)) AT TIME ZONE 'Asia/Kathmandu')"
            )
            params = {"a": app_id, "d": day, "t": time.fromisoformat(hhmm)}
            exists = await conn.scalar(
                text("SELECT id FROM interviews WHERE application_id = :a"),
                {"a": app_id},
            )
            if exists:
                await conn.execute(
                    text(
                        f"UPDATE interviews SET start_time = {start_sql}, "
                        f"end_time = {start_sql} + interval '45 minutes', "
                        "location = :loc, timezone = 'Asia/Kathmandu' WHERE application_id = :a"
                    ),
                    {**params, "loc": MEET_LINK},
                )
            else:
                await conn.execute(
                    text(
                        "INSERT INTO interviews (id, application_id, candidate_name, candidate_email, "
                        "start_time, end_time, timezone, location, title, created_at) VALUES "
                        f"(gen_random_uuid(), :a, :n, :e, {start_sql}, {start_sql} + interval '45 minutes', "
                        "'Asia/Kathmandu', :loc, :ti, now())"
                    ),
                    {
                        **params,
                        "n": name,
                        "e": email,
                        "loc": MEET_LINK,
                        "ti": f"Interview · {title}",
                    },
                )

        # One active job closes in 2 days.
        await conn.execute(
            text(
                """
                UPDATE jobs SET expires_at = now() + interval '2 days'
                WHERE id = (SELECT id FROM jobs WHERE company_id = :c AND status = 'active'
                            ORDER BY created_at LIMIT 1)
                """
            ),
            {"c": company_id},
        )
        await conn.execute(
            text(
                """
                UPDATE jobs SET expires_at = now() + interval '20 days'
                WHERE company_id = :c AND status = 'active' AND expires_at < now() + interval '2 days'
                  AND id <> (SELECT id FROM jobs WHERE company_id = :c AND status = 'active'
                             ORDER BY created_at LIMIT 1)
                """
            ),
            {"c": company_id},
        )

        # AI reviews: applied candidates are reviewed and await a recruiter;
        # the most recent expired job has recommendations ready to approve.
        await conn.execute(
            text(
                """
                UPDATE applications a SET ai_review_status = 'completed', ai_flag_reason = NULL
                FROM jobs j WHERE j.id = a.job_id AND j.company_id = :c AND a.status = 'applied'
                """
            ),
            {"c": company_id},
        )
        await conn.execute(
            text(
                """
                UPDATE jobs SET final_shortlist_completed = false
                WHERE id = (SELECT j.id FROM jobs j JOIN applications a ON a.job_id = j.id
                            WHERE j.company_id = :c AND j.status = 'expired' AND a.status = 'applied'
                            ORDER BY j.expires_at DESC LIMIT 1)
                """
            ),
            {"c": company_id},
        )
        # One CV flagged for a person to check.
        await conn.execute(
            text(
                """
                UPDATE applications SET ai_review_status = 'needs_human_review',
                    ai_flag_reason = 'Possible hidden instructions in the CV'
                WHERE id = (SELECT a.id FROM applications a JOIN jobs j ON j.id = a.job_id
                            JOIN users u ON u.id = a.user_id
                            WHERE j.company_id = :c AND a.status = 'applied' AND u.email <> :cand
                            ORDER BY a.created_at DESC LIMIT 1)
                """
            ),
            {"c": company_id, "cand": CANDIDATE_EMAIL},
        )

        # Applicants waiting over 5 days without a decision.
        await conn.execute(
            text(
                """
                UPDATE applications a SET created_at = now() - interval '8 days',
                    updated_at = now() - interval '8 days'
                FROM jobs j WHERE j.id = a.job_id AND j.company_id = :c AND a.status = 'applied'
                  AND a.id IN (SELECT a2.id FROM applications a2 JOIN jobs j2 ON j2.id = a2.job_id
                               WHERE j2.company_id = :c AND a2.status = 'applied'
                               ORDER BY a2.created_at LIMIT 3)
                """
            ),
            {"c": company_id},
        )

        # Two shortlist emails drafted but not sent.
        recruiter_id = await conn.scalar(
            text("SELECT id FROM users WHERE email = :e"), {"e": RECRUITER_EMAIL}
        )
        shortlisted = (
            await conn.execute(
                text(
                    """
                    SELECT a.id, u.full_name, j.title FROM applications a
                    JOIN jobs j ON j.id = a.job_id JOIN users u ON u.id = a.user_id
                    WHERE j.company_id = :c AND a.status = 'shortlisted'
                    ORDER BY a.created_at LIMIT 2
                    """
                ),
                {"c": company_id},
            )
        ).all()
        for app_id, name, title in shortlisted:
            await conn.execute(
                text(
                    "DELETE FROM email_drafts WHERE application_id = :a AND is_sent = false"
                ),
                {"a": app_id},
            )
            await conn.execute(
                text(
                    "INSERT INTO email_drafts (id, application_id, subject, body, is_approved, is_sent, "
                    "is_discarded, created_at, updated_at, generated_by_user_id) VALUES "
                    "(gen_random_uuid(), :a, :s, :b, false, false, false, now(), now(), :r)"
                ),
                {
                    "a": app_id,
                    "s": f"Next step for {title}",
                    "b": f"<p>Hi {name.split()[0]},</p><p>Thanks for applying. "
                    "We'd like to talk. Please pick a time that suits you.</p>",
                    "r": recruiter_id,
                },
            )

    await engine.dispose()
    print("Demo data refreshed for F1Soft and", CANDIDATE_EMAIL)


if __name__ == "__main__":
    assert_local_target("seed_demo_refresh")
    asyncio.run(refresh())

"""Refresh the seeded demo so time-based screens always have something to show.

seed_data.py writes fixed dates, so after a day "Today" is empty and nothing is
closing soon. This moves the demo data relative to now: F1Soft interviews today
and tomorrow, a job closing in 2 days, one CV flagged for a person, one review
still running, applicants waiting over 5 days, and every non-tech job open for
at least another week (with its interviews in the coming days).

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
                    SELECT a.id, u.full_name, u.email, j.title, j.posted_by
                    FROM applications a
                    JOIN jobs j ON j.id = a.job_id
                    JOIN users u ON u.id = a.user_id
                    WHERE j.company_id = :c AND a.stage = 'interview'
                      AND NOT EXISTS (
                        SELECT 1 FROM interviews d
                        WHERE d.application_id = a.id AND d.status = 'done')
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
        for (app_id, name, email, title, interviewer), (day, hhmm) in zip(
            booked, slots, strict=False
        ):
            start_sql = (
                "((date_trunc('day', now() AT TIME ZONE 'Asia/Kathmandu') "
                "+ make_interval(days => :d) + CAST(:t AS time)) AT TIME ZONE 'Asia/Kathmandu')"
            )
            params = {"a": app_id, "d": day, "t": time.fromisoformat(hhmm)}
            exists = await conn.scalar(
                text(
                    "SELECT id FROM interviews WHERE application_id = :a "
                    "AND status = 'booked'"
                ),
                {"a": app_id},
            )
            if exists:
                await conn.execute(
                    text(
                        f"UPDATE interviews SET start_time = {start_sql}, "
                        f"end_time = {start_sql} + interval '45 minutes', "
                        "location = :loc, timezone = 'Asia/Kathmandu', "
                        "reminder_24h_sent_at = NULL, reminder_1h_sent_at = NULL "
                        "WHERE application_id = :a AND status = 'booked'"
                    ),
                    {**params, "loc": MEET_LINK},
                )
            else:
                await conn.execute(
                    text(
                        "INSERT INTO interviews (id, application_id, company_id, "
                        "interviewer_user_id, candidate_name, candidate_email, "
                        "start_time, end_time, timezone, location, title, status, "
                        "ics_uid, sequence, created_at, updated_at) VALUES "
                        "(gen_random_uuid(), :a, :c, :iv, :n, :e, "
                        f"{start_sql}, {start_sql} + interval '45 minutes', "
                        "'Asia/Kathmandu', :loc, :ti, 'booked', "
                        "'demo-' || gen_random_uuid() || '@rojgarai', 0, now(), now())"
                    ),
                    {
                        **params,
                        "c": company_id,
                        "iv": interviewer,
                        "n": name,
                        "e": email,
                        "loc": MEET_LINK,
                        "ti": f"Interview: {title}",
                    },
                )

        # One open job closes in 2 days; the others stay open for a while.
        first_open = (
            "(SELECT id FROM jobs WHERE company_id = :c AND status = 'open' "
            "ORDER BY created_at LIMIT 1)"
        )
        await conn.execute(
            text(
                f"UPDATE jobs SET closes_at = now() + interval '2 days' WHERE id = {first_open}"
            ),
            {"c": company_id},
        )
        await conn.execute(
            text(
                f"""
                UPDATE jobs SET closes_at = now() + interval '20 days'
                WHERE company_id = :c AND status = 'open'
                  AND (closes_at IS NULL OR closes_at < now() + interval '2 days')
                  AND id <> {first_open}
                """
            ),
            {"c": company_id},
        )

        # Reviews: seeded reviews are finished, except one CV flagged for a
        # person to check and one review still running. Applicants seeded with
        # no review stay pending; the server reviews them on start-up.
        await conn.execute(
            text(
                """
                UPDATE application_reviews r SET state = 'done', flag_reason = NULL
                FROM applications a JOIN jobs j ON j.id = a.job_id
                WHERE r.application_id = a.id AND j.company_id = :c AND a.stage = 'new'
                  AND r.fit IS NOT NULL
                """
            ),
            {"c": company_id},
        )
        await conn.execute(
            text(
                """
                UPDATE application_reviews SET state = 'needs_person', fit = NULL,
                    flag_reason = 'Possible hidden instructions in the CV. Check the CV before deciding.'
                WHERE application_id = (
                    SELECT a.id FROM applications a JOIN jobs j ON j.id = a.job_id
                    JOIN users u ON u.id = a.user_id
                    WHERE j.company_id = :c AND a.stage = 'new' AND u.email <> :cand
                    ORDER BY a.id DESC LIMIT 1)
                """
            ),
            {"c": company_id, "cand": CANDIDATE_EMAIL},
        )
        await conn.execute(
            text(
                """
                UPDATE application_reviews SET state = 'pending', fit = NULL,
                    summary = NULL, checks = '[]'::jsonb, attempts = 0
                WHERE application_id = (
                    SELECT a.id FROM applications a JOIN jobs j ON j.id = a.job_id
                    JOIN application_reviews r ON r.application_id = a.id
                    JOIN users u ON u.id = a.user_id
                    WHERE j.company_id = :c AND a.stage = 'new' AND r.state = 'done'
                      AND u.email <> :cand
                    ORDER BY a.id DESC LIMIT 1)
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
                WHERE a.id IN (SELECT a2.id FROM applications a2 JOIN jobs j2 ON j2.id = a2.job_id
                               WHERE j2.company_id = :c AND a2.stage = 'new'
                               ORDER BY a2.id LIMIT 3)
                """
            ),
            {"c": company_id},
        )
        await conn.execute(
            text(
                """
                UPDATE application_events e SET created_at = a.created_at
                FROM applications a
                WHERE e.application_id = a.id AND e.type = 'applied'
                  AND a.created_at = now() - interval '8 days'
                """
            )
        )

        # Non-tech employers: keep their jobs open and interviews upcoming.
        await conn.execute(
            text(
                """
                UPDATE jobs SET closes_at = now() + interval '7 days'
                WHERE status = 'open' AND category <> 'it_software'
                  AND (closes_at IS NULL OR closes_at < now() + interval '7 days')
                """
            )
        )
        await conn.execute(
            text(
                """
                WITH due AS (
                    SELECT i.id, row_number() OVER (ORDER BY i.start_time) AS n
                    FROM interviews i
                    JOIN applications a ON a.id = i.application_id
                    JOIN jobs j ON j.id = a.job_id
                    WHERE j.category <> 'it_software' AND i.status = 'booked'
                      AND i.start_time < now()
                )
                UPDATE interviews i SET
                    start_time = date_trunc('day', now()) + interval '1 day 4 hours'
                        + due.n * interval '1 hour',
                    end_time = date_trunc('day', now()) + interval '1 day 4 hours 30 minutes'
                        + due.n * interval '1 hour',
                    reminder_24h_sent_at = NULL, reminder_1h_sent_at = NULL
                FROM due WHERE i.id = due.id
                """
            )
        )

    await engine.dispose()
    print(
        "Demo data refreshed for F1Soft,", CANDIDATE_EMAIL, "and the non-tech employers"
    )


if __name__ == "__main__":
    assert_local_target("seed_demo_refresh")
    asyncio.run(refresh())

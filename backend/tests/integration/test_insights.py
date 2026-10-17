from datetime import UTC, datetime, timedelta

from app.modules.applications.models import ApplicationEvent
from app.modules.interviews.models import Interview
from app.shared.enums import ApplicationStage as S
from tests.integration.helpers import (
    auth_headers,
    make_active_job,
    make_application,
    make_candidate_with_resume,
    make_recruiter_admin,
)

NOW = datetime.now(UTC)
URL = "/dashboards/insights"


async def _apply(db, job, n, stage=S.new, *, days_ago=1, **fields):
    user, resume = await make_candidate_with_resume(db, f"i{n}-{job.id}@test.com")
    application = await make_application(db, user.id, job.id, resume.id, stage)
    application.created_at = NOW - timedelta(days=days_ago)
    application.updated_at = NOW
    for key, value in fields.items():
        setattr(application, key, value)
    await db.flush()
    return application


async def _moved(db, application, to: S, at, from_: S = S.new):
    """A person's decision on the timeline."""
    db.add(
        ApplicationEvent(
            application_id=application.id,
            type="stage_changed",
            payload={"from": from_.value, "to": to.value},
            created_at=at,
        )
    )
    await db.flush()


async def _get(client, admin, **params):
    response = await client.get(URL, params=params, headers=auth_headers(admin.id))
    assert response.status_code == 200, response.text
    return response.json()["data"]


async def test_hiring_progress_counts_are_cumulative(client, db):
    admin, company = await make_recruiter_admin(db)
    job = await make_active_job(db, company.id)
    await _apply(db, job, 1)
    await _apply(db, job, 2, S.shortlisted)
    await _apply(db, job, 3, S.interview)
    await _apply(db, job, 4, S.offer)
    await _apply(db, job, 5, S.hired)
    # Turned the offer down.
    declined = await _apply(db, job, 6, S.withdrawn)
    await _moved(db, declined, S.offer, NOW - timedelta(hours=1), S.interview)
    # Rejected after an interview that already happened: still counts as interviewed.
    rejected_late = await _apply(db, job, 7, S.rejected)
    db.add(
        Interview(
            application_id=rejected_late.id,
            company_id=company.id,
            location="https://meet.jit.si/rojgarai-test",
            title="Interview",
            ics_uid="insights-test@rojgarai",
            candidate_name="C",
            candidate_email="c@test.com",
            start_time=NOW - timedelta(hours=5),
            end_time=NOW - timedelta(hours=4),
        )
    )
    # Rejected after an offer, known only from the event history.
    rejected_after_offer = await _apply(db, job, 8, S.rejected)
    await _moved(db, rejected_after_offer, S.offer, NOW, S.interview)
    await _apply(db, job, 9, S.rejected)
    await db.flush()

    data = await _get(client, admin)

    assert data["total"] == 9
    assert {row["stage"]: row["count"] for row in data["progress"]} == {
        "applied": 9,
        "shortlisted": 7,
        "interviewed": 6,
        "offered": 4,
        "hired": 1,
    }
    counts = [row["count"] for row in data["progress"]]
    assert counts == sorted(counts, reverse=True)


async def test_source_counts_bucket_unknown_and_platform(client, db):
    admin, company = await make_recruiter_admin(db)
    job = await make_active_job(db, company.id)
    for n, source in enumerate(
        ["linkedin", "linkedin", "facebook", "viber", "walk_in", "platform", "zzz"]
    ):
        await _apply(db, job, n, source=source)

    data = await _get(client, admin)

    counts = {row["source"]: row["count"] for row in data["sources"]}
    assert counts["linkedin"] == 2
    assert counts["facebook"] == 1
    assert counts["viber"] == 1
    assert counts["walk_in"] == 1
    assert counts["direct"] == 1  # applied on our site while signed in
    assert counts["other"] == 1
    assert counts["merojob"] == 0
    assert sum(counts.values()) == data["total"] == 7


async def test_median_reply_time_uses_first_decision(client, db):
    admin, company = await make_recruiter_admin(db)
    slow = await make_active_job(db, company.id, title="Slow")
    fast = await make_active_job(db, company.id, title="Fast")

    for n, days in enumerate([1, 3, 8]):
        application = await _apply(db, slow, n, S.rejected, days_ago=10)
        await _moved(
            db, application, S.rejected, application.created_at + timedelta(days=days)
        )
    shortlisted = await _apply(db, fast, 10, S.interview, days_ago=10)
    await _moved(
        db, shortlisted, S.shortlisted, shortlisted.created_at + timedelta(days=1)
    )
    # A later stage change must not move the first reply.
    await _moved(db, shortlisted, S.interview, NOW, S.shortlisted)
    await _apply(db, fast, 11, days_ago=4)  # still waiting

    data = await _get(client, admin)

    by_title = {row["title"]: row for row in data["replies"]}
    assert by_title["Slow"]["median_days"] == 3.0
    assert by_title["Slow"]["replied"] == 3
    assert by_title["Fast"]["median_days"] == 1.0
    assert by_title["Fast"]["waiting"] == 1
    assert by_title["Fast"]["oldest_waiting_days"] == 4
    # Slow: replies take 3 days. Fast: replies in 1 day, but someone has waited 4.
    assert [row["title"] for row in data["replies"]] == ["Fast", "Slow"]
    assert data["median_reply_days"] == 2.0  # median of 1, 3, 8, 1


async def test_job_and_date_filters(client, db):
    admin, company = await make_recruiter_admin(db)
    job = await make_active_job(db, company.id, title="One")
    other = await make_active_job(db, company.id, title="Two")
    await _apply(db, job, 1, days_ago=2)
    await _apply(db, job, 2, days_ago=60)
    await _apply(db, other, 3, days_ago=2)

    last_30 = (NOW - timedelta(days=29)).date().isoformat()
    data = await _get(client, admin, job_id=str(job.id), **{"from": last_30})
    assert data["total"] == 1
    assert {j["title"] for j in data["jobs"]} == {"One", "Two"}
    # The weekly trend always shows at least 12 weeks, scoped to the job.
    assert len(data["weekly"]) >= 12
    assert sum(week["count"] for week in data["weekly"]) == 2

    everything = await _get(client, admin)
    assert everything["total"] == 3


async def test_other_company_job_is_not_found(client, db):
    admin, _ = await make_recruiter_admin(db)
    _, other_company = await make_recruiter_admin(
        db, email="other@test.com", company_name="Other"
    )
    foreign = await make_active_job(db, other_company.id)

    response = await client.get(
        URL, params={"job_id": str(foreign.id)}, headers=auth_headers(admin.id)
    )
    assert response.status_code == 404

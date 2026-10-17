from datetime import UTC, datetime, timedelta

from app.modules.interviews.models import Interview
from app.shared.enums import ApplicationStatus, JobStatus
from tests.integration.helpers import (
    auth_headers,
    make_active_job,
    make_application,
    make_candidate_with_resume,
    make_member,
    make_recruiter_admin,
)

NOW = datetime.now(UTC)
COUNT_KEYS = {"to_review", "strong", "to_contact", "upcoming_interviews", "to_decide"}


async def _apply(db, job, n, status=ApplicationStatus.applied, **fields):
    user, resume = await make_candidate_with_resume(db, f"c{n}-{job.id}@test.com")
    application = await make_application(db, user.id, job.id, resume.id, status)
    for key, value in fields.items():
        setattr(application, key, value)
    await db.flush()
    return application


async def _interview(db, application, start):
    db.add(
        Interview(
            application_id=application.id,
            cal_booking_uid=f"uid-{application.id}",
            candidate_name="Candidate",
            candidate_email="candidate@test.com",
            start_time=start,
            end_time=start + timedelta(minutes=45),
        )
    )
    await db.flush()


async def test_role_card_counts_reflect_waiting_work(client, db):
    admin, company = await make_recruiter_admin(db)
    job = await make_active_job(
        db, company.id, shortlist_threshold=70, expires_at=NOW + timedelta(days=5)
    )
    await _apply(db, job, 1, score=85)
    await _apply(db, job, 2, score=40)
    await _apply(db, job, 3, ApplicationStatus.shortlisted)
    await _apply(db, job, 4, ApplicationStatus.shortlisted, shortlist_notified=True)
    past = await _apply(db, job, 5, ApplicationStatus.interview_booked)
    await _interview(db, past, NOW - timedelta(days=1))
    future = await _apply(db, job, 6, ApplicationStatus.interview_booked)
    await _interview(db, future, NOW + timedelta(days=2))
    await _apply(db, job, 7, ApplicationStatus.interview_completed)
    await _apply(db, job, 8, ApplicationStatus.rejected)

    response = await client.get(
        "/dashboards/recruiter/home", headers=auth_headers(admin.id)
    )

    assert response.status_code == 200
    [card] = response.json()["data"]["roles"]
    assert card["applicants"] == 8
    assert {key: card[key] for key in COUNT_KEYS} == {
        "to_review": 2,
        "strong": 1,
        "to_contact": 1,
        "upcoming_interviews": 1,
        "to_decide": 2,
    }


async def test_closed_roles_only_shown_while_work_is_waiting(client, db):
    admin, company = await make_recruiter_admin(db)
    recent_with_work = await make_active_job(
        db,
        company.id,
        title="Closed, still waiting",
        status=JobStatus.expired,
        expires_at=NOW - timedelta(days=3),
    )
    await _apply(db, recent_with_work, 1)
    recent_done = await make_active_job(
        db,
        company.id,
        title="Closed, nothing waiting",
        status=JobStatus.expired,
        expires_at=NOW - timedelta(days=3),
    )
    await _apply(db, recent_done, 2, ApplicationStatus.rejected)
    old = await make_active_job(
        db,
        company.id,
        title="Closed long ago",
        status=JobStatus.expired,
        expires_at=NOW - timedelta(days=90),
    )
    await _apply(db, old, 3)
    await make_active_job(db, company.id, title="Unfinished", status=JobStatus.draft)

    response = await client.get(
        "/dashboards/recruiter/home", headers=auth_headers(admin.id)
    )

    data = response.json()["data"]
    assert [role["title"] for role in data["roles"]] == ["Closed, still waiting"]
    assert [draft["title"] for draft in data["drafts"]] == ["Unfinished"]


async def test_todays_interviews_use_the_viewer_timezone(client, db):
    admin, company = await make_recruiter_admin(db)
    job = await make_active_job(db, company.id)
    application = await _apply(db, job, 1, ApplicationStatus.interview_booked)
    # 20:00 UTC is already tomorrow (01:45) in Kathmandu.
    tomorrow_utc = (NOW + timedelta(days=1)).replace(
        hour=20, minute=0, second=0, microsecond=0
    )
    await _interview(db, application, tomorrow_utc)

    utc_view = await client.get(
        "/dashboards/recruiter/home",
        params={"tz": "UTC"},
        headers=auth_headers(admin.id),
    )
    utc_data = utc_view.json()["data"]
    assert utc_data["interviews_today"] == []
    assert utc_data["next_interview"]["application_id"] == str(application.id)

    bogus_tz = await client.get(
        "/dashboards/recruiter/home",
        params={"tz": "Not/AZone"},
        headers=auth_headers(admin.id),
    )
    assert bogus_tz.status_code == 200


async def test_is_admin_only_for_owners(client, db):
    admin, company = await make_recruiter_admin(db)
    manager = await make_member(db, company.id, email="manager@test.com")

    owner_view = await client.get(
        "/dashboards/recruiter/home", headers=auth_headers(admin.id)
    )
    manager_view = await client.get(
        "/dashboards/recruiter/home", headers=auth_headers(manager.id)
    )

    assert owner_view.json()["data"]["is_admin"] is True
    assert manager_view.json()["data"]["is_admin"] is False


async def test_candidates_cannot_open_recruiter_home(client, db):
    candidate, _ = await make_candidate_with_resume(db)

    response = await client.get(
        "/dashboards/recruiter/home", headers=auth_headers(candidate.id)
    )

    assert response.status_code == 403


async def test_jobs_overview_lists_every_role_with_counts(client, db):
    admin, company = await make_recruiter_admin(db)
    open_job = await make_active_job(db, company.id, title="Open")
    await _apply(db, open_job, 1)
    await make_active_job(
        db,
        company.id,
        title="Closed long ago",
        status=JobStatus.expired,
        expires_at=NOW - timedelta(days=90),
    )
    await make_active_job(db, company.id, title="Draft", status=JobStatus.draft)

    response = await client.get(
        "/dashboards/recruiter/jobs", headers=auth_headers(admin.id)
    )

    rows = {row["title"]: row for row in response.json()["data"]}
    assert set(rows) == {"Open", "Closed long ago", "Draft"}
    assert rows["Open"]["to_review"] == 1
    assert rows["Draft"]["applicants"] == 0

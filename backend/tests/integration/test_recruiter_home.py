from datetime import UTC, datetime, timedelta

from app.modules.applications.models import Application, ApplicationEvent, Review
from app.modules.interviews.models import Interview
from app.modules.jobs.models import Job
from app.shared.enums import (
    ApplicationStage,
    EventType,
    JobStatus,
    LocationType,
)
from tests.integration.helpers import (
    auth_headers,
    make_candidate_with_resume,
    make_member,
    make_recruiter_admin,
)

NOW = datetime.now(UTC)
COUNT_KEYS = {"to_review", "strong", "to_contact", "upcoming_interviews", "to_decide"}


async def make_active_job(db, company_id, **overrides) -> Job:
    fields = dict(
        title="Backend Engineer",
        location="Remote",
        location_type=LocationType.remote,
        status=JobStatus.open,
        description="Test job",
    )
    fields.update(overrides)
    if fields["status"] == JobStatus.closed:
        fields.setdefault("closed_reason", "expired")
    job = Job(company_id=company_id, **fields)
    db.add(job)
    await db.flush()
    return job


async def _apply(
    db, job, n, stage=ApplicationStage.new, *, fit=None, events=()
) -> Application:
    user, resume = await make_candidate_with_resume(db, f"c{n}-{job.id}@test.com")
    application = Application(
        job_id=job.id, user_id=user.id, resume_id=resume.id, stage=stage
    )
    db.add(application)
    await db.flush()
    if fit is not None:
        db.add(Review(application_id=application.id, state="done", fit=fit))
    for event_type in events:
        db.add(ApplicationEvent(application_id=application.id, type=event_type))
    await db.flush()
    return application


async def _interview(db, application, start):
    db.add(
        Interview(
            application_id=application.id,
            company_id=(await db.get(Job, application.job_id)).company_id,
            ics_uid=f"uid-{application.id}",
            candidate_name="Candidate",
            candidate_email="candidate@test.com",
            start_time=start,
            end_time=start + timedelta(minutes=45),
            location="https://meet.jit.si/rojgarai-test",
            title="Interview",
        )
    )
    await db.flush()


async def test_role_card_counts_reflect_waiting_work(client, db):
    admin, company = await make_recruiter_admin(db)
    job = await make_active_job(db, company.id, closes_at=NOW + timedelta(days=5))
    await _apply(db, job, 1, fit="strong")
    await _apply(db, job, 2, fit="weak")
    await _apply(db, job, 3, ApplicationStage.shortlisted)
    await _apply(
        db, job, 4, ApplicationStage.shortlisted, events=[EventType.email_sent.value]
    )
    past = await _apply(db, job, 5, ApplicationStage.interview)
    await _interview(db, past, NOW - timedelta(days=1))
    future = await _apply(db, job, 6, ApplicationStage.interview)
    await _interview(db, future, NOW + timedelta(days=2))
    await _apply(
        db, job, 7, ApplicationStage.interview, events=[EventType.interview_done.value]
    )
    await _apply(db, job, 8, ApplicationStage.rejected)

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
        status=JobStatus.closed,
        closed_at=NOW - timedelta(days=3),
    )
    await _apply(db, recent_with_work, 1)
    recent_done = await make_active_job(
        db,
        company.id,
        title="Closed, nothing waiting",
        status=JobStatus.closed,
        closed_at=NOW - timedelta(days=3),
    )
    await _apply(db, recent_done, 2, ApplicationStage.rejected)
    old = await make_active_job(
        db,
        company.id,
        title="Closed long ago",
        status=JobStatus.closed,
        closed_at=NOW - timedelta(days=90),
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
    application = await _apply(db, job, 1, ApplicationStage.interview)
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
        status=JobStatus.closed,
        closed_at=NOW - timedelta(days=90),
    )
    await make_active_job(db, company.id, title="Draft", status=JobStatus.draft)

    response = await client.get(
        "/dashboards/recruiter/jobs", headers=auth_headers(admin.id)
    )

    rows = {row["title"]: row for row in response.json()["data"]}
    assert set(rows) == {"Open", "Closed long ago", "Draft"}
    assert rows["Open"]["to_review"] == 1
    assert rows["Draft"]["applicants"] == 0


async def test_dashboard_endpoints_run_on_stage_and_review_data(client, db):
    admin, company = await make_recruiter_admin(db)
    job = await make_active_job(db, company.id)
    await _apply(db, job, 1, fit="strong")
    done = await _apply(
        db, job, 2, ApplicationStage.interview, events=[EventType.interview_done.value]
    )
    await _interview(db, done, NOW - timedelta(hours=2))
    offered = await _apply(db, job, 3, ApplicationStage.offer)
    candidate_id = offered.user_id

    for path in (
        "/dashboards/recruiter",
        "/dashboards/recruiter/analytics",
        "/dashboards/recruiter-admin",
        "/dashboards/recruiter-admin/analytics",
    ):
        response = await client.get(path, headers=auth_headers(admin.id))
        assert response.status_code == 200, (path, response.text)

    analytics = (
        await client.get(
            "/dashboards/recruiter/analytics", headers=auth_headers(admin.id)
        )
    ).json()["data"]
    assert analytics["stats"]["interview_completed"] == 1
    assert analytics["stats"]["offers"] == 1
    fits = {b["label"]: b["count"] for b in analytics["fit_distribution"]["buckets"]}
    assert fits == {"strong": 1, "possible": 0, "weak": 0}

    for path in ("/dashboards/candidate", "/dashboards/candidate/analytics"):
        response = await client.get(path, headers=auth_headers(candidate_id))
        assert response.status_code == 200, (path, response.text)
    items = (
        await client.get("/dashboards/candidate", headers=auth_headers(candidate_id))
    ).json()["data"]["applications"]
    assert [(i["status"], i["pipeline_step"]) for i in items] == [("offer", 4)]

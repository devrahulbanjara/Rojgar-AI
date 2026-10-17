"""Owner and Manager decide; an Interviewer sees the applicants of the jobs
they interview for, writes notes and interview notes, and decides nothing."""

from app.modules.auth.enums import MembershipRole
from app.modules.interviews.models import InterviewInvite
from app.shared.enums import ApplicationStage
from tests.integration.helpers import (
    auth_headers,
    make_active_job,
    make_application,
    make_candidate_with_resume,
    make_member,
    make_recruiter_admin,
)


async def _team(db):
    owner, company = await make_recruiter_admin(db, email="owner@roles.t")
    manager = await make_member(db, company.id, email="manager@roles.t")
    interviewer = await make_member(
        db, company.id, email="iv@roles.t", role=MembershipRole.interviewer
    )
    theirs = await make_active_job(db, company.id, title="Cook")
    other = await make_active_job(db, company.id, title="Cashier")
    applicants = []
    for n, job in enumerate((theirs, other)):
        user, resume = await make_candidate_with_resume(db, email=f"a{n}@roles.t")
        if n == 0:
            user.email = None  # phone-only applicant
        applicants.append(
            await make_application(
                db,
                user.id,
                job.id,
                resume.id,
                ApplicationStage.shortlisted,
                shared_email_value=None if n == 0 else f"a{n}@roles.t",
            )
        )
    db.add(
        InterviewInvite(
            application_id=applicants[0].id,
            interviewer_user_id=interviewer.id,
            created_by_user_id=owner.id,
        )
    )
    await db.flush()
    return owner, manager, interviewer, theirs, other, applicants


async def test_interviewer_sees_only_the_jobs_they_interview_for(client, db):
    _, _, interviewer, theirs, other, (mine, not_mine) = await _team(db)
    headers = auth_headers(interviewer.id)

    panel = await client.get(f"/recruiter/v2/applications/{mine.id}", headers=headers)
    assert panel.status_code == 200
    assert panel.json()["data"]["actions"] == []
    assert panel.json()["data"]["notify_channel"] == "none"

    hidden = await client.get(
        f"/recruiter/v2/applications/{not_mine.id}", headers=headers
    )
    assert hidden.status_code == 404
    pipeline = await client.get(
        f"/recruiter/v2/jobs/{other.id}/pipeline", headers=headers
    )
    assert pipeline.status_code == 404

    jobs = await client.get("/dashboards/recruiter/jobs", headers=headers)
    assert [r["title"] for r in jobs.json()["data"]] == ["Cook"]
    home = await client.get("/dashboards/recruiter/home", headers=headers)
    assert home.json()["data"]["role"] == "interviewer"
    assert home.json()["data"]["drafts"] == []

    note = await client.post(
        f"/recruiter/v2/applications/{mine.id}/notes",
        json={"text": "Good knife skills"},
        headers=headers,
    )
    assert note.status_code == 201


async def test_interviewer_cannot_decide_or_edit_jobs(client, db):
    _, _, interviewer, theirs, _, (mine, _) = await _team(db)
    headers = auth_headers(interviewer.id)

    decide = await client.post(
        "/recruiter/v2/decide",
        json={"action": "reject", "application_ids": [str(mine.id)]},
        headers=headers,
    )
    assert decide.status_code == 403
    assert decide.json()["message"] == (
        "Only the owner or a manager can do this. Ask them."
    )
    for method, path, body in (
        ("post", "/jobs/", {"title": "Helper", "location_type": "onsite"}),
        ("patch", f"/jobs/{theirs.id}", {"status": "closed"}),
        ("delete", f"/jobs/{theirs.id}", None),
        ("post", f"/applications/{mine.id}/invite", {"notify": False}),
        ("get", "/applications/company/me/candidates", None),
        ("get", "/dashboards/insights", None),
    ):
        kwargs = {"headers": headers}
        if body is not None:
            kwargs["json"] = body
        resp = await getattr(client, method)(path, **kwargs)
        assert resp.status_code == 403, (method, path, resp.text)


async def test_manager_decides_and_owner_too(client, db):
    owner, manager, _, _, _, (mine, not_mine) = await _team(db)

    for person, application in ((manager, mine), (owner, not_mine)):
        resp = await client.post(
            "/recruiter/v2/decide",
            json={"action": "reject", "application_ids": [str(application.id)]},
            headers=auth_headers(person.id),
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["results"][0]["ok"] is True

    panel = await client.get(
        f"/recruiter/v2/applications/{not_mine.id}", headers=auth_headers(manager.id)
    )
    assert "move_back" in panel.json()["data"]["actions"]
    assert panel.json()["data"]["notify_channel"] == "email"


async def test_manager_cannot_manage_the_team(client, db):
    owner, manager, *_ = await _team(db)
    from app.modules.companies.models import CompanyMembership
    from sqlalchemy import select

    business_id = await db.scalar(
        select(CompanyMembership.company_id).where(
            CompanyMembership.user_id == owner.id
        )
    )
    resp = await client.post(
        f"/businesses/{business_id}/invites",
        json={"role": "manager"},
        headers=auth_headers(manager.id),
    )
    assert resp.status_code == 403

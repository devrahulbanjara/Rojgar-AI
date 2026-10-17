"""Recruiter v2 API: pipeline, candidate panel, decisions with undo, notes,
quick add, referral links, export, and public recommendations."""

import json
import uuid

from sqlalchemy import select

from app.modules.applications import emails
from app.modules.applications.models import Application, ApplicationEvent
from app.modules.jobs.models import JobReferrer
from app.shared.enums import ApplicationStage
from tests.integration.helpers import (
    auth_headers,
    make_active_job,
    make_application,
    make_candidate_with_resume,
    make_recruiter_admin,
)


async def _job_with_apps(db, tag: str, n: int = 3, stages=None):
    admin, company = await make_recruiter_admin(db, email=f"admin_{tag}@t.com")
    job = await make_active_job(db, company.id, must_haves=["Cash handling"])
    apps = []
    reviews = [
        {"state": "done", "fit": "weak", "summary": "Weak", "rank_score": 10.0},
        {"state": "done", "fit": "strong", "summary": "Strong", "rank_score": 90.0},
        {
            "state": "needs_person",
            "fit": "strong",
            "summary": "hidden",
            "flag_reason": "Possible hidden instructions",
        },
        {"state": "done", "fit": "possible", "summary": "Possible", "rank_score": 60.0},
    ]
    for i in range(n):
        cand, resume = await make_candidate_with_resume(db, email=f"c{i}_{tag}@t.com")
        stage = (stages or {}).get(i, ApplicationStage.new)
        apps.append(
            await make_application(
                db,
                cand.id,
                job.id,
                resume.id,
                stage,
                review=reviews[i % len(reviews)],
                shared_full_name=f"Person {i}",
                shared_email_value=f"c{i}_{tag}@t.com",
                source="walk_in" if i == 0 else "linkedin",
            )
        )
    return admin, job, apps


async def _decide(client, admin, action, ids, **extra):
    return await client.post(
        "/recruiter/v2/decide",
        json={"action": action, "application_ids": [str(i) for i in ids], **extra},
        headers=auth_headers(admin.id),
    )


class TestPipeline:
    async def test_counts_and_best_fit_order(self, client, db):
        admin, job, apps = await _job_with_apps(
            db, "pipe", 4, stages={3: ApplicationStage.shortlisted}
        )
        resp = await client.get(
            f"/recruiter/v2/jobs/{job.id}/pipeline", headers=auth_headers(admin.id)
        )
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["counts"]["new"] == 3 and data["counts"]["shortlisted"] == 1
        names = [item["name"] for item in data["items"]]
        # strong, possible, weak, then the flagged one (no fit shown)
        assert names == ["Person 1", "Person 3", "Person 0", "Person 2"]
        flagged = data["items"][-1]
        assert flagged["flagged"] is True
        assert flagged["fit"] is None and flagged["summary"] is None
        assert data["items"][2]["source"] == "walk_in"

    async def test_other_company_cannot_read(self, client, db):
        _admin, job, _apps = await _job_with_apps(db, "tenancy", 1)
        outsider, _ = await make_recruiter_admin(db, email="outsider@t.com", company_name="X")
        resp = await client.get(
            f"/recruiter/v2/jobs/{job.id}/pipeline", headers=auth_headers(outsider.id)
        )
        assert resp.status_code == 404


class TestPanel:
    async def test_panel_shows_checks_answers_events_and_respects_share_flags(
        self, client, db
    ):
        admin, job, apps = await _job_with_apps(db, "panel", 2)
        app = apps[1]
        app.share_profile_all = False
        app.share_phone = False
        app.shared_phone_value = "+9779841234567"
        app.screening_answers = [{"question": "Notice period?", "answer": "1 month"}]
        await db.flush()
        resp = await client.get(
            f"/recruiter/v2/applications/{app.id}", headers=auth_headers(admin.id)
        )
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["person"]["phone"] is None  # not shared
        assert data["review"]["fit"] == "strong"
        assert data["answers"] == [{"question": "Notice period?", "answer": "1 month"}]
        assert data["actions"] == ["shortlist", "reject", "withdraw"]
        assert data["other_applications"] == 0


class TestDecide:
    async def test_shortlist_writes_event_and_schedules_email_then_undo(
        self, client, db
    ):
        admin, _job, apps = await _job_with_apps(db, "undo", 1)
        resp = await _decide(client, admin, "shortlist", [apps[0].id])
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["undo_seconds"] == 10
        result = data["results"][0]
        assert result["ok"] and result["stage"] == "shortlisted"
        assert result["email_scheduled"] is True
        await db.refresh(apps[0])
        assert apps[0].stage == ApplicationStage.shortlisted
        assert apps[0].decided_by == admin.id

        undo = await client.post(
            "/recruiter/v2/undo",
            json={"event_ids": data["undo_event_ids"]},
            headers=auth_headers(admin.id),
        )
        assert undo.status_code == 200
        assert undo.json()["data"]["undone"] == [str(apps[0].id)]
        await db.refresh(apps[0])
        assert apps[0].stage == ApplicationStage.new
        assert apps[0].decided_by is None
        types = list(
            await db.scalars(
                select(ApplicationEvent.type).where(
                    ApplicationEvent.application_id == apps[0].id
                )
            )
        )
        assert "stage_changed" not in types and "email_scheduled" not in types

    async def test_undo_fails_once_the_email_is_out(self, client, db):
        admin, _job, apps = await _job_with_apps(db, "sent", 1)
        data = (await _decide(client, admin, "reject", [apps[0].id])).json()["data"]
        email_id = (
            await db.scalar(
                select(ApplicationEvent.id).where(
                    ApplicationEvent.application_id == apps[0].id,
                    ApplicationEvent.type == "email_scheduled",
                )
            )
        )
        assert await emails.deliver(email_id, db=db) is True
        assert await emails.deliver(email_id, db=db) is False  # sent once only
        sent = await db.scalar(
            select(ApplicationEvent)
            .where(ApplicationEvent.id == email_id)
            .execution_options(populate_existing=True)
        )
        assert sent.type == "email_sent" and sent.payload["status"] == "sent"
        assert sent.payload["template"] == "rejection"

        undo = await client.post(
            "/recruiter/v2/undo",
            json={"event_ids": data["undo_event_ids"]},
            headers=auth_headers(admin.id),
        )
        assert undo.json()["data"]["failed"][0]["reason"] == "email_sent"
        await db.refresh(apps[0])
        assert apps[0].stage == ApplicationStage.rejected
        assert apps[0].rejected_reason == "not_a_fit"

    async def test_bulk_reject_one_request_many_people(self, client, db):
        admin, _job, apps = await _job_with_apps(
            db, "bulk", 3, stages={2: ApplicationStage.hired}
        )
        resp = await _decide(
            client,
            admin,
            "reject",
            [a.id for a in apps] + [uuid.uuid4()],
            rejected_reason="position_filled",
        )
        results = resp.json()["data"]["results"]
        assert [r["ok"] for r in results] == [True, True, False, False]
        assert results[2]["error"] == "cannot reject from hired"
        assert results[3]["error"] == "not_found"
        assert len(resp.json()["data"]["undo_event_ids"]) == 2
        for app in apps[:2]:
            await db.refresh(app)
            assert app.stage == ApplicationStage.rejected
            assert app.rejected_reason == "position_filled"

    async def test_full_path_and_invalid_transitions(self, client, db):
        admin, _job, apps = await _job_with_apps(db, "path", 1)
        app_id = apps[0].id
        assert (await _decide(client, admin, "make_offer", [app_id])).json()["data"][
            "results"
        ][0]["error"] == "cannot make_offer from new"
        for action, stage in [
            ("shortlist", "shortlisted"),
            ("invite_to_interview", "interview"),
            ("make_offer", "offer"),
            ("mark_hired", "hired"),
            ("move_back", "offer"),
        ]:
            result = (await _decide(client, admin, action, [app_id])).json()["data"][
                "results"
            ][0]
            assert result["ok"], (action, result)
            assert result["stage"] == stage
        assert (
            await _decide(client, admin, "withdraw", [app_id])
        ).json()["data"]["results"][0]["stage"] == "withdrawn"

    async def test_move_back_returns_to_the_stage_it_came_from(self, client, db):
        admin, _job, apps = await _job_with_apps(
            db, "back", 1, stages={0: ApplicationStage.interview}
        )
        await _decide(client, admin, "reject", [apps[0].id])
        result = (await _decide(client, admin, "move_back", [apps[0].id])).json()[
            "data"
        ]["results"][0]
        assert result["stage"] == "interview"

    async def test_candidate_without_email_gets_no_scheduled_email(self, client, db):
        admin, _job, apps = await _job_with_apps(db, "noemail", 1)
        from app.modules.auth.models import User

        apps[0].shared_email_value = None
        (await db.get(User, apps[0].user_id)).email = None
        await db.flush()
        result = (await _decide(client, admin, "shortlist", [apps[0].id])).json()[
            "data"
        ]["results"][0]
        assert result["ok"] and result["email_scheduled"] is False


class TestNotesAndFlags:
    async def test_note_lands_on_the_timeline(self, client, db):
        admin, _job, apps = await _job_with_apps(db, "note", 1)
        resp = await client.post(
            f"/recruiter/v2/applications/{apps[0].id}/notes",
            json={"text": "  Called, available from Monday  "},
            headers=auth_headers(admin.id),
        )
        assert resp.status_code == 201
        assert resp.json()["data"]["payload"] == {"text": "Called, available from Monday"}
        panel = await client.get(
            f"/recruiter/v2/applications/{apps[0].id}", headers=auth_headers(admin.id)
        )
        assert panel.json()["data"]["events"][-1]["type"] == "note"

    async def test_clear_flag_requeues_review(self, client, db):
        admin, _job, apps = await _job_with_apps(db, "flag", 3)
        flagged = apps[2]
        resp = await client.post(
            f"/recruiter/v2/applications/{flagged.id}/clear-flag",
            headers=auth_headers(admin.id),
        )
        assert resp.status_code == 200
        review = resp.json()["data"]["review"]
        assert review["state"] == "pending" and review["flagged"] is False
        again = await client.post(
            f"/recruiter/v2/applications/{flagged.id}/clear-flag",
            headers=auth_headers(admin.id),
        )
        assert again.status_code == 409


class TestQuickAddReferrersExport:
    async def test_quick_add_walk_in_without_cv(self, client, db):
        admin, company = await make_recruiter_admin(db, email="admin_qa@t.com")
        job = await make_active_job(db, company.id)
        resp = await client.post(
            f"/recruiter/v2/jobs/{job.id}/candidates",
            data={
                "full_name": "  Hari   Bahadur ",
                "phone": "984-1234567",
                "source": "referral",
                "referred_by": "Ram Thapa (staff)",
                "answers": json.dumps([{"question": "Notice?", "answer": "Now"}]),
            },
            headers=auth_headers(admin.id),
        )
        assert resp.status_code == 201, resp.text
        application = await db.scalar(
            select(Application).where(
                Application.id == resp.json()["data"]["application_id"]
            )
        )
        assert application.resume_id is None
        assert application.shared_phone_value == "+9779841234567"
        assert application.source == "referral"
        referrer = await db.get(JobReferrer, application.referrer_id)
        assert referrer.name == "Ram Thapa (staff)"
        from app.modules.auth.models import User

        person = await db.get(User, application.user_id)
        assert person.email is None and person.phone == "+9779841234567"

        dup = await client.post(
            f"/recruiter/v2/jobs/{job.id}/candidates",
            data={"full_name": "Hari", "phone": "+977 9841234567", "source": "walk_in"},
            headers=auth_headers(admin.id),
        )
        assert dup.status_code == 409

    async def test_referrer_links_and_export(self, client, db):
        admin, job, apps = await _job_with_apps(db, "ref", 2)
        created = await client.post(
            f"/recruiter/v2/jobs/{job.id}/referrers",
            json={"name": "Sita didi", "phone": "9801234567"},
            headers=auth_headers(admin.id),
        )
        assert created.status_code == 201
        data = created.json()["data"]
        assert data["link"].endswith(f"/jobs/{job.slug}?ref={data['token']}")
        assert data["phone"] == "+9779801234567"
        apps[0].referrer_id = uuid.UUID(data["id"])
        await db.flush()
        listed = await client.get(
            f"/recruiter/v2/jobs/{job.id}/referrers", headers=auth_headers(admin.id)
        )
        assert listed.json()["data"][0]["applications"] == 1

        export = await client.get(
            f"/recruiter/v2/jobs/{job.id}/export.csv", headers=auth_headers(admin.id)
        )
        assert export.status_code == 200
        assert export.headers["content-type"].startswith("text/csv")
        lines = export.text.lstrip("﻿").splitlines()
        assert lines[0].startswith("Name,Phone,Email,Stage,Fit")
        assert "Sita didi" in export.text and "Strong fit" in export.text


class TestPublicRecommend:
    async def test_recommend_creates_referral_application(self, client, db):
        admin, company = await make_recruiter_admin(db, email="admin_rec@t.com")
        job = await make_active_job(db, company.id)
        referrer = JobReferrer(job_id=job.id, name="Ram Thapa (staff)", token="tok123")
        db.add(referrer)
        await db.flush()
        page = await client.get(f"/public/jobs/{job.slug}?ref=tok123")
        assert page.json()["data"]["shared_by"] == "Ram Thapa (staff)"

        resp = await client.post(
            f"/public/jobs/{job.slug}/recommend",
            json={
                "ref_token": "tok123",
                "referrer_name": "Ram",
                "candidate_name": "Gita Rai",
                "candidate_phone": "9812345678",
                "note": "Worked with her at a hotel",
            },
        )
        assert resp.status_code == 201, resp.text
        application = await db.scalar(
            select(Application).where(Application.job_id == job.id)
        )
        assert application.source == "referral"
        assert application.referrer_id == referrer.id
        assert application.stage == ApplicationStage.new
        pipeline = await client.get(
            f"/recruiter/v2/jobs/{job.id}/pipeline", headers=auth_headers(admin.id)
        )
        item = pipeline.json()["data"]["items"][0]
        assert item["referred_by"]["name"] == "Ram Thapa (staff)"
        assert item["phone"] == "+9779812345678"

        again = await client.post(
            f"/public/jobs/{job.slug}/recommend",
            json={
                "referrer_name": "Someone",
                "candidate_name": "Gita",
                "candidate_phone": "+977-9812345678",
            },
        )
        assert again.status_code == 409

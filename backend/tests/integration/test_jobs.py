import uuid

from tests.integration.helpers import (
    auth_headers,
    make_active_job,
    make_application,
    make_candidate,
    make_candidate_with_resume,
    make_recruiter_admin,
)


class TestJobCreate:
    async def test_recruiter_creates_job_201(self, client, db):
        admin, _ = await make_recruiter_admin(db)

        resp = await client.post(
            "/jobs/",
            json={"title": "Senior Dev", "location_type": "remote"},
            headers=auth_headers(admin.id),
        )
        assert resp.status_code == 201
        assert resp.json()["data"]["title"] == "Senior Dev"

    async def test_create_job_no_auth_401(self, client):
        resp = await client.post(
            "/jobs/",
            json={"title": "Test Job", "location_type": "remote"},
        )
        assert resp.status_code == 401

    async def test_candidate_cannot_create_job_403(self, client, db):
        candidate = await make_candidate(db)

        resp = await client.post(
            "/jobs/",
            json={"title": "Test Job", "location_type": "remote"},
            headers=auth_headers(candidate.id),
        )
        assert resp.status_code == 403


class TestJobRead:
    async def test_list_public_jobs_200(self, client):
        resp = await client.get("/jobs/")
        assert resp.status_code == 200
        body = resp.json()
        assert "items" in body["data"]

    async def test_get_job_detail_200(self, client, db):
        admin, company = await make_recruiter_admin(db)
        job = await make_active_job(db, company.id)

        resp = await client.get(f"/jobs/{job.id}")
        assert resp.status_code == 200
        assert resp.json()["data"]["id"] == str(job.id)

    async def test_get_job_not_found_404(self, client):
        resp = await client.get(f"/jobs/{uuid.uuid4()}")
        assert resp.status_code == 404

    async def test_list_company_jobs_requires_auth_401(self, client):
        resp = await client.get("/jobs/company/me")
        assert resp.status_code == 401

    async def test_recruiter_lists_own_company_jobs(self, client, db):
        admin, company = await make_recruiter_admin(db)
        await make_active_job(db, company.id)

        resp = await client.get("/jobs/company/me", headers=auth_headers(admin.id))
        assert resp.status_code == 200
        jobs = resp.json()["data"]
        assert len(jobs) >= 1

    async def test_company_jobs_include_real_applications_count(self, client, db):
        admin, company = await make_recruiter_admin(db)
        job = await make_active_job(db, company.id)
        candidate, resume = await make_candidate_with_resume(
            db, email="jobs-count-candidate@test.com"
        )
        await make_application(db, candidate.id, job.id, resume.id)
        await db.commit()

        resp = await client.get("/jobs/company/me", headers=auth_headers(admin.id))
        assert resp.status_code == 200
        jobs = resp.json()["data"]
        job_payload = next((item for item in jobs if item["id"] == str(job.id)), None)
        assert job_payload is not None
        assert job_payload["applications_count"] == 1


class TestJobUpdate:
    async def test_update_job_200(self, client, db):
        admin, company = await make_recruiter_admin(db)
        job = await make_active_job(db, company.id)

        resp = await client.patch(
            f"/jobs/{job.id}",
            json={"title": "Updated Title"},
            headers=auth_headers(admin.id),
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["title"] == "Updated Title"

    async def test_delete_job_200(self, client, db):
        admin, company = await make_recruiter_admin(db)
        job = await make_active_job(db, company.id)

        resp = await client.delete(f"/jobs/{job.id}", headers=auth_headers(admin.id))
        assert resp.status_code == 200

        # Job should be gone
        get_resp = await client.get(f"/jobs/{job.id}")
        assert get_resp.status_code == 404


class TestJobV2Fields:
    async def test_create_with_criteria_questions_and_protected_ground_warning(
        self, client, db
    ):
        admin, _ = await make_recruiter_admin(db, email="v2create@test.com")
        resp = await client.post(
            "/jobs/",
            json={
                "title": "Front Office Receptionist",
                "category": "hospitality_tourism",
                "employment_type": "full_time",
                "status": "open",
                "description": "## About\nGreet guests at our Thamel hotel.",
                "must_haves": [
                    "Fluent in English and Nepali",
                    "Female receptionist",
                    "Fluent in English and Nepali",
                ],
                "nice_to_haves": ["Opera PMS"],
                "questions": [
                    {
                        "label": "Can you work night shifts?",
                        "type": "yes_no",
                        "knockout_answer": "yes",
                    },
                    {
                        "label": "Notice period?",
                        "type": "short_text",
                        "knockout_answer": "no",
                    },
                ],
            },
            headers=auth_headers(admin.id),
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()["data"]
        assert data["status"] == "open" and data["currency"] == "NPR"
        assert data["must_haves"] == [
            "Fluent in English and Nepali",
            "Female receptionist",
        ]
        assert data["questions"][1]["knockout_answer"] is None  # only yes/no
        assert [(w["field"], w["index"], w["ground"]) for w in data["warnings"]] == [
            ("must_haves", 1, "gender")
        ]

    async def test_more_than_six_must_haves_rejected(self, client, db):
        admin, _ = await make_recruiter_admin(db, email="v2many@test.com")
        resp = await client.post(
            "/jobs/",
            json={"title": "Cook", "must_haves": [f"Skill {i}" for i in range(7)]},
            headers=auth_headers(admin.id),
        )
        assert resp.status_code == 400

    async def test_close_as_hired_tells_everyone_still_waiting(self, client, db):
        from sqlalchemy import select

        from app.modules.applications.models import ApplicationEvent
        from app.shared.enums import ApplicationStage

        admin, company = await make_recruiter_admin(db, email="v2close@test.com")
        job = await make_active_job(db, company.id)
        stages = [
            ApplicationStage.new,
            ApplicationStage.interview,
            ApplicationStage.offer,
            ApplicationStage.hired,
        ]
        apps = []
        for i, stage in enumerate(stages):
            cand, resume = await make_candidate_with_resume(db, email=f"close{i}@t.com")
            apps.append(
                await make_application(
                    db,
                    cand.id,
                    job.id,
                    resume.id,
                    stage,
                    shared_email_value=f"close{i}@t.com",
                )
            )

        no_reason = await client.patch(
            f"/jobs/{job.id}", json={"status": "closed"}, headers=auth_headers(admin.id)
        )
        assert no_reason.status_code == 400
        resp = await client.patch(
            f"/jobs/{job.id}",
            json={"status": "closed", "closed_reason": "hired"},
            headers=auth_headers(admin.id),
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["closed_reason"] == "hired"
        for app in apps:
            await db.refresh(app)
        assert [a.stage for a in apps] == [
            ApplicationStage.rejected,
            ApplicationStage.rejected,
            ApplicationStage.offer,
            ApplicationStage.hired,
        ]
        assert apps[0].rejected_reason == "position_filled"
        scheduled = list(
            await db.scalars(
                select(ApplicationEvent.application_id).where(
                    ApplicationEvent.type == "email_scheduled"
                )
            )
        )
        assert sorted(scheduled) == sorted([apps[0].id, apps[1].id])

    async def test_changing_must_haves_rereviews_new_applications(self, client, db):
        from sqlalchemy import select

        from app.modules.applications.models import Review

        admin, company = await make_recruiter_admin(db, email="v2rereview@test.com")
        job = await make_active_job(db, company.id, must_haves=["Cooking"])
        cand, resume = await make_candidate_with_resume(db, email="rr@t.com")
        app = await make_application(
            db, cand.id, job.id, resume.id, review={"state": "done", "fit": "strong"}
        )
        resp = await client.patch(
            f"/jobs/{job.id}",
            json={"must_haves": ["Cooking", "Food safety training"]},
            headers=auth_headers(admin.id),
        )
        assert resp.status_code == 200
        review = await db.scalar(
            select(Review)
            .where(Review.application_id == app.id)
            .execution_options(populate_existing=True)
        )
        assert review.state == "pending" and review.fit is None

    async def test_suggest_must_haves_drops_protected_grounds(
        self, client, db, monkeypatch
    ):
        from app.infrastructures.ai.service import ai_service

        async def fake(_prompt, _payload, schema, **_kwargs):
            return schema(
                must_haves=[
                    "Valid driving licence (heavy)",
                    "Male only",
                    "Knows routes",
                ],
                nice_to_haves=["Basic English"],
                questions=[
                    {
                        "label": "Do you have a licence?",
                        "type": "yes_no",
                        "required": True,
                        "knockout_answer": "yes",
                    }
                ],
            )

        monkeypatch.setattr(ai_service, "generate_structured", fake)
        admin, _ = await make_recruiter_admin(db, email="v2suggest@test.com")
        resp = await client.post(
            "/jobs/suggest-must-haves",
            json={
                "title": "Truck driver",
                "description": "Drive trucks Kathmandu-Birgunj.",
            },
            headers=auth_headers(admin.id),
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()["data"]
        assert data["must_haves"] == ["Valid driving licence (heavy)", "Knows routes"]
        assert data["warnings"][0]["ground"] == "gender"
        assert data["questions"][0]["knockout_answer"] == "yes"

    async def test_role_templates_endpoint(self, client, db):
        admin, _ = await make_recruiter_admin(db, email="v2tpl@test.com")
        resp = await client.get(
            "/job-templates",
            params={"category": "healthcare"},
            headers=auth_headers(admin.id),
        )
        assert resp.status_code == 200
        titles = [t["title"] for t in resp.json()["data"]]
        assert any("Nurse" in t for t in titles)
        assert all(t["category"] == "healthcare" for t in resp.json()["data"])

    async def test_public_job_json_has_category_and_employment_type(self, client, db):
        _, company = await make_recruiter_admin(db, email="v2pub@test.com")
        from app.shared.enums import EmploymentType, JobCategory

        job = await make_active_job(
            db,
            company.id,
            category=JobCategory.healthcare,
            employment_type=EmploymentType.part_time,
            questions=[
                {
                    "label": "NNC licence?",
                    "type": "yes_no",
                    "required": True,
                    "knockout_answer": "yes",
                }
            ],
        )
        data = (await client.get(f"/public/jobs/{job.slug}")).json()["data"]
        assert data["category"] == {"value": "healthcare", "label": "Healthcare"}
        assert data["employment_type"] == "part_time"
        assert "knockout_answer" not in data["questions"][0]

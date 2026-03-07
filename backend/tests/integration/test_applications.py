import pytest

from tests.integration.helpers import (
    auth_headers,
    make_company,
    make_membership,
    make_user,
)


class TestApplicationSubmit:
    @pytest.mark.asyncio
    async def test_candidate_can_apply_to_open_job(self, client, db):
        recruiter = await make_user(
            db, "recruiter_apply@test.com", role="recruiter_admin"
        )
        cand = await make_user(db, "cand_apply@test.com")
        company = await make_company(db, "Apply Co", "applyco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post(
            "/jobs/",
            json={
                "title": "Apply Job",
                "location_type": "remote",
                "status": "open",
            },
            headers=auth_headers(recruiter),
        )
        job_id = create_resp.json()["data"]["id"]
        resume_resp = await client.post(
            "/resumes/",
            json={"resume_name": "Apply Resume"},
            headers=auth_headers(cand),
        )
        resume_id = resume_resp.json()["data"]["id"]

        resp = await client.post(
            "/applications/",
            json={
                "job_id": job_id,
                "resume_id": resume_id,
            },
            headers=auth_headers(cand),
        )
        assert resp.status_code == 201
        assert resp.json()["data"]["status"] == "submitted"

    @pytest.mark.asyncio
    async def test_cannot_apply_to_closed_job(self, client, db):
        recruiter = await make_user(
            db, "recruiter_closed@test.com", role="recruiter_admin"
        )
        cand = await make_user(db, "cand_closed@test.com")
        company = await make_company(db, "Closed Co", "closedco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post(
            "/jobs/",
            json={
                "title": "Closed Job",
                "location_type": "remote",
                "status": "open",
            },
            headers=auth_headers(recruiter),
        )
        job_id = create_resp.json()["data"]["id"]
        # Close the job
        await client.patch(
            f"/jobs/{job_id}",
            json={"status": "closed"},
            headers=auth_headers(recruiter),
        )
        resume_resp = await client.post(
            "/resumes/",
            json={"resume_name": "Closed Resume"},
            headers=auth_headers(cand),
        )
        resume_id = resume_resp.json()["data"]["id"]

        resp = await client.post(
            "/applications/",
            json={
                "job_id": job_id,
                "resume_id": resume_id,
            },
            headers=auth_headers(cand),
        )
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_cannot_apply_to_draft_job(self, client, db):
        recruiter = await make_user(
            db, "recruiter_draft_app@test.com", role="recruiter_admin"
        )
        cand = await make_user(db, "cand_draft_app@test.com")
        company = await make_company(db, "Draft App Co", "draftappco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post(
            "/jobs/",
            json={
                "title": "Draft App Job",
                "location_type": "remote",
                "status": "draft",
            },
            headers=auth_headers(recruiter),
        )
        job_id = create_resp.json()["data"]["id"]
        resume_resp = await client.post(
            "/resumes/",
            json={"resume_name": "Draft Resume"},
            headers=auth_headers(cand),
        )
        resume_id = resume_resp.json()["data"]["id"]

        resp = await client.post(
            "/applications/",
            json={
                "job_id": job_id,
                "resume_id": resume_id,
            },
            headers=auth_headers(cand),
        )
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_duplicate_application_rejected(self, client, db):
        recruiter = await make_user(
            db, "recruiter_dup_app@test.com", role="recruiter_admin"
        )
        cand = await make_user(db, "cand_dup_app@test.com")
        company = await make_company(db, "Dup App Co", "dupappco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post(
            "/jobs/",
            json={
                "title": "Dup Job",
                "location_type": "remote",
                "status": "open",
            },
            headers=auth_headers(recruiter),
        )
        job_id = create_resp.json()["data"]["id"]
        resume_resp = await client.post(
            "/resumes/", json={"resume_name": "Dup Resume"}, headers=auth_headers(cand)
        )
        resume_id = resume_resp.json()["data"]["id"]
        payload = {"job_id": job_id, "resume_id": resume_id}

        await client.post("/applications/", json=payload, headers=auth_headers(cand))
        resp = await client.post(
            "/applications/", json=payload, headers=auth_headers(cand)
        )
        assert resp.status_code == 409

    @pytest.mark.asyncio
    async def test_cannot_apply_with_another_users_resume(self, client, db):
        recruiter = await make_user(
            db, "recruiter_idor@test.com", role="recruiter_admin"
        )
        cand_a = await make_user(db, "cand_idor_a@test.com")
        cand_b = await make_user(db, "cand_idor_b@test.com")
        company = await make_company(db, "IDOR Co", "idorco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post(
            "/jobs/",
            json={
                "title": "IDOR Job",
                "location_type": "remote",
                "status": "open",
            },
            headers=auth_headers(recruiter),
        )
        job_id = create_resp.json()["data"]["id"]
        # cand_b creates a resume
        resume_resp = await client.post(
            "/resumes/", json={"resume_name": "B Resume"}, headers=auth_headers(cand_b)
        )
        other_resume_id = resume_resp.json()["data"]["id"]

        # cand_a tries to apply with cand_b's resume
        resp = await client.post(
            "/applications/",
            json={
                "job_id": job_id,
                "resume_id": other_resume_id,
            },
            headers=auth_headers(cand_a),
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_recruiter_cannot_apply_to_job(self, client, db):
        recruiter = await make_user(
            db, "recruiter_self_apply@test.com", role="recruiter_admin"
        )
        company = await make_company(db, "Self Apply Co", "selfapplyco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post(
            "/jobs/",
            json={
                "title": "Self Apply Job",
                "location_type": "remote",
                "status": "open",
            },
            headers=auth_headers(recruiter),
        )
        job_id = create_resp.json()["data"]["id"]

        resp = await client.post(
            "/applications/",
            json={
                "job_id": job_id,
                "resume_id": "00000000-0000-0000-0000-000000000000",
            },
            headers=auth_headers(recruiter),
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_apply_to_nonexistent_job(self, client, db):
        cand = await make_user(db, "cand_nojob@test.com")
        resume_resp = await client.post(
            "/resumes/",
            json={"resume_name": "No Job Resume"},
            headers=auth_headers(cand),
        )
        resume_id = resume_resp.json()["data"]["id"]

        resp = await client.post(
            "/applications/",
            json={
                "job_id": "00000000-0000-0000-0000-000000000000",
                "resume_id": resume_id,
            },
            headers=auth_headers(cand),
        )
        assert resp.status_code == 404


class TestApplicationRead:
    @pytest.mark.asyncio
    async def test_candidate_can_list_own_applications(self, client, db):
        recruiter = await make_user(
            db, "recruiter_list_app@test.com", role="recruiter_admin"
        )
        cand = await make_user(db, "cand_list_app@test.com")
        company = await make_company(db, "List App Co", "listappco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post(
            "/jobs/",
            json={
                "title": "List App Job",
                "location_type": "remote",
                "status": "open",
            },
            headers=auth_headers(recruiter),
        )
        job_id = create_resp.json()["data"]["id"]
        resume_resp = await client.post(
            "/resumes/", json={"resume_name": "List Resume"}, headers=auth_headers(cand)
        )
        resume_id = resume_resp.json()["data"]["id"]

        await client.post(
            "/applications/",
            json={"job_id": job_id, "resume_id": resume_id},
            headers=auth_headers(cand),
        )

        resp = await client.get("/applications/me", headers=auth_headers(cand))
        assert resp.status_code == 200
        assert len(resp.json()["data"]) >= 1

    @pytest.mark.asyncio
    async def test_recruiter_can_list_applications_for_own_job(self, client, db):
        recruiter = await make_user(
            db, "recruiter_job_apps@test.com", role="recruiter_admin"
        )
        cand = await make_user(db, "cand_job_apps@test.com")
        company = await make_company(db, "Job Apps Co", "jobappsco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post(
            "/jobs/",
            json={
                "title": "Job Apps Job",
                "location_type": "remote",
                "status": "open",
            },
            headers=auth_headers(recruiter),
        )
        job_id = create_resp.json()["data"]["id"]
        resume_resp = await client.post(
            "/resumes/",
            json={"resume_name": "Job Apps Resume"},
            headers=auth_headers(cand),
        )
        resume_id = resume_resp.json()["data"]["id"]

        await client.post(
            "/applications/",
            json={"job_id": job_id, "resume_id": resume_id},
            headers=auth_headers(cand),
        )

        resp = await client.get(
            f"/applications/job/{job_id}", headers=auth_headers(recruiter)
        )
        assert resp.status_code == 200
        assert len(resp.json()["data"]) >= 1

    @pytest.mark.asyncio
    async def test_candidate_cannot_list_applications_for_a_job(self, client, db):
        recruiter = await make_user(
            db, "recruiter_cand_nolist@test.com", role="recruiter_admin"
        )
        cand = await make_user(db, "cand_nolist@test.com")
        company = await make_company(db, "No List Co", "nolistco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post(
            "/jobs/",
            json={
                "title": "No List Job",
                "location_type": "remote",
                "status": "open",
            },
            headers=auth_headers(recruiter),
        )
        job_id = create_resp.json()["data"]["id"]

        resp = await client.get(
            f"/applications/job/{job_id}", headers=auth_headers(cand)
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_candidate_can_get_own_application_detail(self, client, db):
        recruiter = await make_user(
            db, "recruiter_app_detail@test.com", role="recruiter_admin"
        )
        cand = await make_user(db, "cand_app_detail@test.com")
        company = await make_company(db, "App Detail Co", "appdetailco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post(
            "/jobs/",
            json={
                "title": "Detail Job",
                "location_type": "remote",
                "status": "open",
            },
            headers=auth_headers(recruiter),
        )
        job_id = create_resp.json()["data"]["id"]
        resume_resp = await client.post(
            "/resumes/",
            json={"resume_name": "Detail Resume"},
            headers=auth_headers(cand),
        )
        resume_id = resume_resp.json()["data"]["id"]

        apply_resp = await client.post(
            "/applications/",
            json={"job_id": job_id, "resume_id": resume_id},
            headers=auth_headers(cand),
        )
        app_id = apply_resp.json()["data"]["id"]

        resp = await client.get(f"/applications/{app_id}", headers=auth_headers(cand))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_other_candidate_cannot_see_application(self, client, db):
        recruiter = await make_user(
            db, "recruiter_spy@test.com", role="recruiter_admin"
        )
        cand_a = await make_user(db, "cand_spy_a@test.com")
        cand_b = await make_user(db, "cand_spy_b@test.com")
        company = await make_company(db, "Spy Co", "spyco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post(
            "/jobs/",
            json={
                "title": "Spy Job",
                "location_type": "remote",
                "status": "open",
            },
            headers=auth_headers(recruiter),
        )
        job_id = create_resp.json()["data"]["id"]
        resume_resp = await client.post(
            "/resumes/",
            json={"resume_name": "Spy Resume"},
            headers=auth_headers(cand_a),
        )
        resume_id = resume_resp.json()["data"]["id"]

        apply_resp = await client.post(
            "/applications/",
            json={"job_id": job_id, "resume_id": resume_id},
            headers=auth_headers(cand_a),
        )
        app_id = apply_resp.json()["data"]["id"]

        resp = await client.get(f"/applications/{app_id}", headers=auth_headers(cand_b))
        assert resp.status_code == 403


class TestApplicationStatusUpdate:
    @pytest.mark.asyncio
    async def test_recruiter_can_update_application_status(self, client, db):
        recruiter = await make_user(
            db, "recruiter_status@test.com", role="recruiter_admin"
        )
        cand = await make_user(db, "cand_status@test.com")
        company = await make_company(db, "Status Co", "statusco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post(
            "/jobs/",
            json={
                "title": "Status Job",
                "location_type": "remote",
                "status": "open",
            },
            headers=auth_headers(recruiter),
        )
        job_id = create_resp.json()["data"]["id"]
        resume_resp = await client.post(
            "/resumes/",
            json={"resume_name": "Status Resume"},
            headers=auth_headers(cand),
        )
        resume_id = resume_resp.json()["data"]["id"]

        apply_resp = await client.post(
            "/applications/",
            json={"job_id": job_id, "resume_id": resume_id},
            headers=auth_headers(cand),
        )
        app_id = apply_resp.json()["data"]["id"]

        resp = await client.patch(
            f"/applications/{app_id}/status",
            json={"status": "interview"},
            headers=auth_headers(recruiter),
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "interview"

    @pytest.mark.asyncio
    async def test_candidate_cannot_update_application_status(self, client, db):
        recruiter = await make_user(
            db, "recruiter_no_status@test.com", role="recruiter_admin"
        )
        cand = await make_user(db, "cand_no_status@test.com")
        company = await make_company(db, "No Status Co", "nostatusco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post(
            "/jobs/",
            json={
                "title": "No Status Job",
                "location_type": "remote",
                "status": "open",
            },
            headers=auth_headers(recruiter),
        )
        job_id = create_resp.json()["data"]["id"]
        resume_resp = await client.post(
            "/resumes/",
            json={"resume_name": "No Status Resume"},
            headers=auth_headers(cand),
        )
        resume_id = resume_resp.json()["data"]["id"]

        apply_resp = await client.post(
            "/applications/",
            json={"job_id": job_id, "resume_id": resume_id},
            headers=auth_headers(cand),
        )
        app_id = apply_resp.json()["data"]["id"]

        resp = await client.patch(
            f"/applications/{app_id}/status",
            json={"status": "hired"},
            headers=auth_headers(cand),
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_recruiter_from_different_company_cannot_update_status(
        self, client, db
    ):
        owner_recruiter = await make_user(
            db, "owner_status@test.com", role="recruiter_admin"
        )
        other_recruiter = await make_user(
            db, "other_status@test.com", role="recruiter_admin"
        )
        cand = await make_user(db, "cand_other_status@test.com")
        company_a = await make_company(db, "Owner Status Co", "ownerstatusco.com")
        company_b = await make_company(db, "Other Status Co", "otherstatusco.com")
        await make_membership(db, owner_recruiter, company_a)
        await make_membership(db, other_recruiter, company_b)

        create_resp = await client.post(
            "/jobs/",
            json={
                "title": "Cross Co Job",
                "location_type": "remote",
                "status": "open",
            },
            headers=auth_headers(owner_recruiter),
        )
        job_id = create_resp.json()["data"]["id"]
        resume_resp = await client.post(
            "/resumes/",
            json={"resume_name": "Cross Resume"},
            headers=auth_headers(cand),
        )
        resume_id = resume_resp.json()["data"]["id"]

        apply_resp = await client.post(
            "/applications/",
            json={"job_id": job_id, "resume_id": resume_id},
            headers=auth_headers(cand),
        )
        app_id = apply_resp.json()["data"]["id"]

        resp = await client.patch(
            f"/applications/{app_id}/status",
            json={"status": "rejected"},
            headers=auth_headers(other_recruiter),
        )
        assert resp.status_code == 403

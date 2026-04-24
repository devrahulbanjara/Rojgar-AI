import uuid


from tests.integration.helpers import (
    auth_headers,
    make_active_job,
    make_candidate,
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

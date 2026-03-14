from datetime import datetime, timedelta, timezone

import pytest

from tests.integration.helpers import (
    auth_headers,
    make_company,
    make_membership,
    make_user,
)


class TestJobCreate:
    @pytest.mark.asyncio
    async def test_active_recruiter_can_create_job(self, client, db):
        user = await make_user(db, "recruiter_create@test.com", role="recruiter_admin")
        company = await make_company(db, "Create Job Co", "createjobco.com")
        await make_membership(db, user, company)

        resp = await client.post(
            "/jobs/",
            json={
                "title": "Python Dev",
                "location_type": "remote",
                "currency": "NPR",
                "status": "active",
            },
            headers=auth_headers(user),
        )
        assert resp.status_code == 201
        assert resp.json()["data"]["title"] == "Python Dev"
        expires_at = datetime.fromisoformat(resp.json()["data"]["expires_at"])
        now = datetime.now(timezone.utc)
        assert (
            now + timedelta(days=6, hours=23)
            <= expires_at
            <= now + timedelta(days=7, hours=1)
        )

    @pytest.mark.asyncio
    async def test_candidate_cannot_create_job(self, client, db):
        user = await make_user(db, "cand_create_job@test.com")
        resp = await client.post(
            "/jobs/",
            json={
                "title": "Sneaky Job",
                "location_type": "remote",
            },
            headers=auth_headers(user),
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_recruiter_without_company_cannot_create_job(self, client, db):
        user = await make_user(db, "orphan_recruiter@test.com", role="recruiter_admin")
        resp = await client.post(
            "/jobs/",
            json={
                "title": "Orphan Job",
                "location_type": "remote",
            },
            headers=auth_headers(user),
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_pending_membership_cannot_create_job(self, client, db):
        user = await make_user(db, "pending_recruiter@test.com", role="recruiter_admin")
        company = await make_company(db, "Pending Co", "pendingco.com")
        await make_membership(db, user, company, status="pending")

        resp = await client.post(
            "/jobs/",
            json={
                "title": "Pending Job",
                "location_type": "remote",
            },
            headers=auth_headers(user),
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_create_job_invalid_salary_range(self, client, db):
        user = await make_user(db, "salary_recruiter@test.com", role="recruiter_admin")
        company = await make_company(db, "Salary Co", "salaryco.com")
        await make_membership(db, user, company)

        resp = await client.post(
            "/jobs/",
            json={
                "title": "Bad Salary Job",
                "location_type": "remote",
                "salary_min": 5000000,
                "salary_max": 1000000,
            },
            headers=auth_headers(user),
        )
        assert resp.status_code == 400


class TestJobRead:
    @pytest.mark.asyncio
    async def test_anyone_can_list_open_jobs(self, client, db):
        user = await make_user(db, "recruiter_public@test.com", role="recruiter_admin")
        company = await make_company(db, "Public Co", "publicco.com")
        await make_membership(db, user, company)
        # Create via API so it's visible in the same DB connection the app uses
        resp = await client.post(
            "/jobs/",
            json={
                "title": "Public Open Job",
                "location_type": "remote",
                "status": "active",
            },
            headers=auth_headers(user),
        )
        assert resp.status_code == 201

        resp = await client.get("/jobs/")
        titles = [j["title"] for j in resp.json()["data"]]
        assert "Public Open Job" in titles

    @pytest.mark.asyncio
    async def test_draft_jobs_not_in_public_list(self, client, db):
        user = await make_user(db, "recruiter_draft@test.com", role="recruiter_admin")
        company = await make_company(db, "Draft Co", "draftco.com")
        await make_membership(db, user, company)
        await client.post(
            "/jobs/",
            json={
                "title": "Hidden Draft Job",
                "location_type": "remote",
                "status": "draft",
            },
            headers=auth_headers(user),
        )

        resp = await client.get("/jobs/")
        titles = [j["title"] for j in resp.json()["data"]]
        assert "Hidden Draft Job" not in titles

    @pytest.mark.asyncio
    async def test_get_job_detail(self, client, db):
        user = await make_user(db, "recruiter_detail@test.com", role="recruiter_admin")
        company = await make_company(db, "Detail Co", "detailco.com")
        await make_membership(db, user, company)
        create_resp = await client.post(
            "/jobs/",
            json={
                "title": "Detailed Job",
                "location_type": "remote",
                "status": "active",
            },
            headers=auth_headers(user),
        )
        job_id = create_resp.json()["data"]["id"]

        resp = await client.get(f"/jobs/{job_id}")
        assert resp.status_code == 200
        assert resp.json()["data"]["title"] == "Detailed Job"

    @pytest.mark.asyncio
    async def test_get_nonexistent_job(self, client):
        resp = await client.get("/jobs/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_search_jobs_by_keyword(self, client, db):
        user = await make_user(db, "recruiter_search@test.com", role="recruiter_admin")
        company = await make_company(db, "Search Co", "searchco.com")
        await make_membership(db, user, company)
        await client.post(
            "/jobs/",
            json={
                "title": "Blockchain Wizard",
                "location_type": "remote",
                "status": "active",
            },
            headers=auth_headers(user),
        )

        resp = await client.get("/jobs/?q=Blockchain")
        titles = [j["title"] for j in resp.json()["data"]]
        assert "Blockchain Wizard" in titles

    @pytest.mark.asyncio
    async def test_list_company_jobs_as_recruiter(self, client, db):
        user = await make_user(
            db, "recruiter_company_jobs@test.com", role="recruiter_admin"
        )
        company = await make_company(db, "Company Jobs Co", "cjco.com")
        await make_membership(db, user, company)
        await client.post(
            "/jobs/",
            json={
                "title": "Internal Draft",
                "location_type": "remote",
                "status": "draft",
            },
            headers=auth_headers(user),
        )

        resp = await client.get("/jobs/company/me", headers=auth_headers(user))
        assert resp.status_code == 200
        titles = [j["title"] for j in resp.json()["data"]]
        assert "Internal Draft" in titles

    @pytest.mark.asyncio
    async def test_list_company_jobs_as_candidate_fails(self, client, db):
        cand = await make_user(db, "cand_company_jobs@test.com")
        resp = await client.get("/jobs/company/me", headers=auth_headers(cand))
        assert resp.status_code == 403


class TestJobUpdate:
    @pytest.mark.asyncio
    async def test_recruiter_can_update_own_company_job(self, client, db):
        user = await make_user(db, "recruiter_update@test.com", role="recruiter_admin")
        company = await make_company(db, "Update Co", "updateco.com")
        await make_membership(db, user, company)
        create_resp = await client.post(
            "/jobs/",
            json={
                "title": "Old Title",
                "location_type": "remote",
            },
            headers=auth_headers(user),
        )
        job_id = create_resp.json()["data"]["id"]

        resp = await client.patch(
            f"/jobs/{job_id}", json={"title": "New Title"}, headers=auth_headers(user)
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["title"] == "New Title"

    @pytest.mark.asyncio
    async def test_recruiter_cannot_update_other_company_job(self, client, db):
        owner = await make_user(db, "owner_update@test.com", role="recruiter_admin")
        intruder = await make_user(
            db, "intruder_update@test.com", role="recruiter_admin"
        )
        company_a = await make_company(db, "Owner Co", "ownerco.com")
        company_b = await make_company(db, "Intruder Co", "intruderco.com")
        await make_membership(db, owner, company_a)
        await make_membership(db, intruder, company_b)

        create_resp = await client.post(
            "/jobs/",
            json={
                "title": "Owner Job",
                "location_type": "remote",
            },
            headers=auth_headers(owner),
        )
        job_id = create_resp.json()["data"]["id"]

        resp = await client.patch(
            f"/jobs/{job_id}", json={"title": "Hacked"}, headers=auth_headers(intruder)
        )
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_open_job_shows_in_search_after_status_update(self, client, db):
        user = await make_user(db, "recruiter_publish@test.com", role="recruiter_admin")
        company = await make_company(db, "Publish Co", "publishco.com")
        await make_membership(db, user, company)
        create_resp = await client.post(
            "/jobs/",
            json={
                "title": "Soon Open Job",
                "location_type": "remote",
                "status": "draft",
            },
            headers=auth_headers(user),
        )
        job_id = create_resp.json()["data"]["id"]

        await client.patch(
            f"/jobs/{job_id}", json={"status": "active"}, headers=auth_headers(user)
        )

        resp = await client.get("/jobs/?q=Soon+Open+Job")
        titles = [j["title"] for j in resp.json()["data"]]
        assert "Soon Open Job" in titles


class TestJobDelete:
    @pytest.mark.asyncio
    async def test_recruiter_can_delete_own_job(self, client, db):
        user = await make_user(db, "recruiter_delete@test.com", role="recruiter_admin")
        company = await make_company(db, "Delete Co", "deleteco.com")
        await make_membership(db, user, company)
        create_resp = await client.post(
            "/jobs/",
            json={
                "title": "Delete Me",
                "location_type": "remote",
            },
            headers=auth_headers(user),
        )
        job_id = create_resp.json()["data"]["id"]

        resp = await client.delete(f"/jobs/{job_id}", headers=auth_headers(user))
        assert resp.status_code == 200

        resp = await client.get(f"/jobs/{job_id}")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_candidate_cannot_delete_job(self, client, db):
        recruiter = await make_user(
            db, "recruiter_nodelete@test.com", role="recruiter_admin"
        )
        cand = await make_user(db, "cand_nodelete@test.com")
        company = await make_company(db, "No Delete Co", "nodeleteco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post(
            "/jobs/",
            json={
                "title": "Protected Job",
                "location_type": "remote",
            },
            headers=auth_headers(recruiter),
        )
        job_id = create_resp.json()["data"]["id"]

        resp = await client.delete(f"/jobs/{job_id}", headers=auth_headers(cand))
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# ── PROFILE TESTS ────────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------


class TestProfile:
    @pytest.mark.asyncio
    async def test_get_my_profile_creates_empty_if_missing(self, client, db):
        user = await make_user(db, "profile_empty@test.com")
        resp = await client.get("/profiles/me", headers=auth_headers(user))
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["experiences"] == []
        assert data["educations"] == []

    @pytest.mark.asyncio
    async def test_recruiter_cannot_access_candidate_profile_route(self, client, db):
        recruiter = await make_user(
            db, "recruiter_profile@test.com", role="recruiter_admin"
        )
        resp = await client.get("/profiles/me", headers=auth_headers(recruiter))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_update_profile_fields(self, client, db):
        user = await make_user(db, "profile_update@test.com")
        resp = await client.put(
            "/profiles/me",
            json={
                "headline": "Senior Developer",
                "location": "Kathmandu",
                "years_of_experience": 5,
            },
            headers=auth_headers(user),
        )
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["headline"] == "Senior Developer"
        assert data["location"] == "Kathmandu"

    @pytest.mark.asyncio
    async def test_update_profile_with_experiences(self, client, db):
        user = await make_user(db, "profile_exp@test.com")
        # GET first to ensure profile is initialized in the app's DB session
        await client.get("/profiles/me", headers=auth_headers(user))

        resp = await client.put(
            "/profiles/me",
            json={
                "experiences": [
                    {
                        "company_name": "Tech Corp",
                        "title": "Engineer",
                        "start_date": "2020-01-01",
                        "description": ["Built things"],
                    }
                ]
            },
            headers=auth_headers(user),
        )
        assert resp.status_code == 200
        assert len(resp.json()["data"]["experiences"]) == 1

    @pytest.mark.asyncio
    async def test_update_profile_replaces_experiences(self, client, db):
        """Sending new experiences should wipe old ones."""
        user = await make_user(db, "profile_replace@test.com")
        # Initialize profile first
        await client.get("/profiles/me", headers=auth_headers(user))

        await client.put(
            "/profiles/me",
            json={
                "experiences": [
                    {"company_name": "Old Corp", "title": "Old Role", "description": []}
                ]
            },
            headers=auth_headers(user),
        )

        resp = await client.put(
            "/profiles/me",
            json={
                "experiences": [
                    {"company_name": "New Corp", "title": "New Role", "description": []}
                ]
            },
            headers=auth_headers(user),
        )
        exps = resp.json()["data"]["experiences"]
        assert len(exps) == 1
        assert exps[0]["company_name"] == "New Corp"

    @pytest.mark.asyncio
    async def test_update_profile_with_skills(self, client, db):
        user = await make_user(db, "profile_skills@test.com")
        # Initialize profile first
        await client.get("/profiles/me", headers=auth_headers(user))

        resp = await client.put(
            "/profiles/me",
            json={"skills": [{"skill_name": "Python"}, {"skill_name": "FastAPI"}]},
            headers=auth_headers(user),
        )
        assert resp.status_code == 200
        skill_names = [s["skill_name"] for s in resp.json()["data"]["skills"]]
        assert "Python" in skill_names

    @pytest.mark.asyncio
    async def test_get_profile_by_user_id(self, client, db):
        user = await make_user(db, "profile_public@test.com")
        caller = await make_user(db, "profile_caller@test.com")
        await client.put(
            "/profiles/me", json={"headline": "Public Dev"}, headers=auth_headers(user)
        )

        resp = await client.get(f"/profiles/{user.id}", headers=auth_headers(caller))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_profile_nonexistent_user(self, client, db):
        caller = await make_user(db, "profile_caller2@test.com")
        resp = await client.get(
            "/profiles/00000000-0000-0000-0000-000000000000",
            headers=auth_headers(caller),
        )
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_unauthenticated_cannot_get_profile(self, client):
        resp = await client.get("/profiles/me")
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# ── RESUME TESTS ─────────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------


class TestResume:
    @pytest.mark.asyncio
    async def test_create_resume_forks_from_profile(self, client, db):
        user = await make_user(db, "resume_fork@test.com")
        # Build profile via API so collections are initialized in the app session
        await client.get("/profiles/me", headers=auth_headers(user))
        await client.put(
            "/profiles/me",
            json={
                "headline": "Dev",
                "skills": [{"skill_name": "Go"}],
            },
            headers=auth_headers(user),
        )

        resp = await client.post(
            "/resumes/",
            json={"resume_name": "My First Resume"},
            headers=auth_headers(user),
        )
        assert resp.status_code == 201
        data = resp.json()["data"]
        assert data["resume_name"] == "My First Resume"
        assert data["headline"] == "Dev"
        skill_names = [s["skill_name"] for s in data["skills"]]
        assert "Go" in skill_names

    @pytest.mark.asyncio
    async def test_create_resume_without_profile_still_works(self, client, db):
        user = await make_user(db, "resume_no_profile@test.com")
        resp = await client.post(
            "/resumes/",
            json={"resume_name": "Blank Resume"},
            headers=auth_headers(user),
        )
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_list_my_resumes(self, client, db):
        user = await make_user(db, "resume_list@test.com")
        await client.post(
            "/resumes/", json={"resume_name": "Resume A"}, headers=auth_headers(user)
        )
        await client.post(
            "/resumes/", json={"resume_name": "Resume B"}, headers=auth_headers(user)
        )

        resp = await client.get("/resumes/me", headers=auth_headers(user))
        assert resp.status_code == 200
        names = [r["resume_name"] for r in resp.json()["data"]]
        assert "Resume A" in names
        assert "Resume B" in names

    @pytest.mark.asyncio
    async def test_get_specific_resume(self, client, db):
        user = await make_user(db, "resume_get@test.com")
        create_resp = await client.post(
            "/resumes/", json={"resume_name": "Get Me"}, headers=auth_headers(user)
        )
        resume_id = create_resp.json()["data"]["id"]

        resp = await client.get(f"/resumes/{resume_id}", headers=auth_headers(user))
        assert resp.status_code == 200
        assert resp.json()["data"]["resume_name"] == "Get Me"

    @pytest.mark.asyncio
    async def test_cannot_get_another_users_resume(self, client, db):
        owner = await make_user(db, "resume_owner@test.com")
        thief = await make_user(db, "resume_thief@test.com")
        create_resp = await client.post(
            "/resumes/", json={"resume_name": "Private"}, headers=auth_headers(owner)
        )
        resume_id = create_resp.json()["data"]["id"]

        resp = await client.get(f"/resumes/{resume_id}", headers=auth_headers(thief))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_update_resume(self, client, db):
        user = await make_user(db, "resume_update@test.com")
        create_resp = await client.post(
            "/resumes/", json={"resume_name": "Old Name"}, headers=auth_headers(user)
        )
        resume_id = create_resp.json()["data"]["id"]

        resp = await client.put(
            f"/resumes/{resume_id}",
            json={"resume_name": "New Name"},
            headers=auth_headers(user),
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["resume_name"] == "New Name"

    @pytest.mark.asyncio
    async def test_update_resume_skills(self, client, db):
        user = await make_user(db, "resume_skills_update@test.com")
        create_resp = await client.post(
            "/resumes/",
            json={"resume_name": "Skills Resume"},
            headers=auth_headers(user),
        )
        resume_id = create_resp.json()["data"]["id"]

        resp = await client.put(
            f"/resumes/{resume_id}",
            json={"skills": [{"skill_name": "Rust"}, {"skill_name": "Go"}]},
            headers=auth_headers(user),
        )
        skill_names = [s["skill_name"] for s in resp.json()["data"]["skills"]]
        assert "Rust" in skill_names

    @pytest.mark.asyncio
    async def test_delete_resume(self, client, db):
        user = await make_user(db, "resume_delete@test.com")
        create_resp = await client.post(
            "/resumes/", json={"resume_name": "Delete Me"}, headers=auth_headers(user)
        )
        resume_id = create_resp.json()["data"]["id"]

        resp = await client.delete(f"/resumes/{resume_id}", headers=auth_headers(user))
        assert resp.status_code == 200

        resp = await client.get(f"/resumes/{resume_id}", headers=auth_headers(user))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_recruiter_cannot_access_resume_routes(self, client, db):
        recruiter = await make_user(
            db, "recruiter_resume@test.com", role="recruiter_admin"
        )
        resp = await client.get("/resumes/me", headers=auth_headers(recruiter))
        assert resp.status_code == 403

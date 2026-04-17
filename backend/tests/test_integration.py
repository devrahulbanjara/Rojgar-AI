import pytest


class TestAuth:
    @pytest.mark.asyncio
    async def test_candidate_signup(self, client):
        resp = await client.post(
            "/auth/signup",
            json={
                "full_name": "Test Candidate",
                "email": "test.candidate@example.com",
                "password": "Password@123",
                "primary_role": "candidate",
            },
        )
        assert resp.status_code == 201
        assert resp.json()["message"] == "Account created. Please verify your email."


class TestJobs:
    @pytest.mark.asyncio
    async def test_public_job_list_returns_ok(self, client):
        resp = await client.get("/jobs/")
        assert resp.status_code == 200
        body = resp.json()
        assert "data" in body
        assert "items" in body["data"]

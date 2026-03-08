import pytest

from tests.integration.helpers import auth_headers, make_user


class TestDashboard:
    @pytest.mark.asyncio
    async def test_recruiter_cannot_access_candidate_dashboard(self, client, db):
        recruiter = await make_user(
            db, "recruiter_only_dashboard@test.com", role="recruiter"
        )

        resp = await client.get(
            "/dashboards/candidate", headers=auth_headers(recruiter)
        )

        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_candidate_dashboard_requires_authentication(self, client):
        resp = await client.get("/dashboards/candidate")

        assert resp.status_code == 401

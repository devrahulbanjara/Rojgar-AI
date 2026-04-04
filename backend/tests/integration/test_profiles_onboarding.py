import pytest

from tests.integration.helpers import auth_headers, make_user


class TestCandidateOnboarding:
    @pytest.mark.asyncio
    async def test_candidate_can_complete_onboarding(self, client, db):
        candidate = await make_user(
            db,
            "onboarding.candidate@test.com",
            onboarded=False,
        )

        resp = await client.post(
            "/profiles/onboard",
            json={"target_roles": ["Backend Engineer", "Platform Engineer"]},
            headers=auth_headers(candidate),
        )

        assert resp.status_code == 200
        assert resp.json()["data"]["target_roles"] == [
            "Backend Engineer",
            "Platform Engineer",
        ]

        await db.refresh(candidate)
        assert candidate.is_onboarded is True

    @pytest.mark.asyncio
    async def test_candidate_cannot_complete_onboarding_twice(self, client, db):
        candidate = await make_user(
            db,
            "onboarding.repeat@test.com",
            onboarded=True,
        )

        resp = await client.post(
            "/profiles/onboard",
            json={"target_roles": ["Data Engineer"]},
            headers=auth_headers(candidate),
        )

        assert resp.status_code == 400

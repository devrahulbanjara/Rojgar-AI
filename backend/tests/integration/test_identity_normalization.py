from tests.integration.helpers import (
    TEST_PASSWORD,
    make_candidate,
    make_recruiter_admin,
)


class TestEmailNormalization:
    async def test_signup_rejects_case_variant_of_existing_email(self, client, db):
        await make_candidate(db, email="taken@example.com")

        resp = await client.post(
            "/auth/signup",
            json={
                "full_name": "Case Dup",
                "email": "TAKEN@Example.com",
                "password": "Password@123",
                "primary_role": "candidate",
            },
        )

        assert resp.status_code == 409

    async def test_login_is_case_insensitive(self, client, db):
        await make_candidate(db, email="mixed@example.com")

        resp = await client.post(
            "/auth/login",
            json={"email": "Mixed@Example.COM", "password": TEST_PASSWORD},
        )
        client.cookies.clear()

        assert resp.status_code == 200


class TestCompanyNameUniqueness:
    async def _setup_token(self, client, email: str) -> str:
        signup = await client.post(
            "/auth/signup",
            json={
                "full_name": "Second Admin",
                "email": email,
                "password": "Password@123",
                "primary_role": "recruiter_admin",
            },
        )
        return signup.json()["data"]["setup_token"]

    async def test_cannot_register_case_variant_of_existing_company(self, client, db):
        await make_recruiter_admin(db, email="owner@acme.com", company_name="Acme Corp")
        token = await self._setup_token(client, "impostor@example.com")

        resp = await client.post(
            "/companies/register",
            json={
                "setup_token": token,
                "company_name": "  acme   CORP ",
                "industry": "Software",
                "company_size": "11-50",
            },
        )

        assert resp.status_code == 409

    async def test_join_request_matches_case_insensitively(self, client, db):
        await make_recruiter_admin(
            db, email="owner2@beta.com", company_name="Beta Labs"
        )
        signup = await client.post(
            "/auth/signup",
            json={
                "full_name": "Joiner",
                "email": "joiner@example.com",
                "password": "Password@123",
                "primary_role": "recruiter",
            },
        )
        token = signup.json()["data"]["setup_token"]

        resp = await client.post(
            "/companies/join-request",
            json={"setup_token": token, "company_name": "beta labs"},
        )

        assert resp.status_code < 300

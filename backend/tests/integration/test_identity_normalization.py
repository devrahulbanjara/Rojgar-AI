from tests.integration.helpers import (
    TEST_PASSWORD,
    make_candidate,
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

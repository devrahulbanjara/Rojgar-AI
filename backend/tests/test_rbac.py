import pytest
from app.core.security import create_tokens


@pytest.fixture
async def candidate_headers(db):
    # This is a 'helper' to get a token for a candidate
    # (In a real test you'd create a user in the DB first)
    from app.modules.auth.models import User

    user = User(
        full_name="I am a candidate",
        email="c@test.com",
        primary_role="candidate",
        is_email_verified=True,
    )
    db.add(user)
    await db.commit()

    tokens, _, _ = create_tokens(str(user.id))
    return {"Authorization": f"Bearer {tokens['access_token']}"}


@pytest.mark.asyncio
async def test_candidate_cannot_post_job(client, candidate_headers):
    job_payload = {"title": "Evil Hacker Job"}

    # Attempt to post a job as a candidate
    response = await client.post("/jobs/", json=job_payload, headers=candidate_headers)

    # Your app should return 403 Forbidden
    assert response.status_code == 403

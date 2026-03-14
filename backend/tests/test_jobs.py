import pytest
from app.core.security import create_tokens


@pytest.fixture
async def recruiter_headers(db):
    from app.modules.auth.models import User
    from app.modules.companies.models import Company, CompanyMembership

    company = Company(name="Tech Experts", domain="tech.com")
    db.add(company)
    await db.flush()

    user = User(
        full_name="Recruiter Joe",
        email="joe@tech.com",
        primary_role="recruiter_admin",
        is_email_verified=True,
    )
    db.add(user)
    await db.flush()

    membership = CompanyMembership(
        user_id=user.id, company_id=company.id, role="admin", status="active"
    )
    db.add(membership)
    await db.commit()

    tokens, _, _ = create_tokens(str(user.id))
    return {"Authorization": f"Bearer {tokens['access_token']}"}


@pytest.mark.asyncio
async def test_recruiter_can_post_job(client, recruiter_headers):
    payload = {
        "title": "Senior Python Developer",
        "location": "Remote",
        "location_type": "remote",
        "salary_min": 100000,
        "salary_max": 150000,
    }

    response = await client.post("/jobs/", json=payload, headers=recruiter_headers)

    assert response.status_code == 201
    assert response.json()["data"]["title"] == "Senior Python Developer"

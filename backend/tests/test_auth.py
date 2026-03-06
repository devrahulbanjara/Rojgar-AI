import pytest


@pytest.mark.asyncio
async def test_signup_password_too_short_fails(client):
    """
    Test that a password shorter than 8 characters is rejected by Pydantic validation.
    """
    payload = {
        "full_name": "Rahul Test",
        "email": "rahul@test.com",
        "password": "1234",
        "primary_role": "candidate",
    }

    response = await client.post("/auth/signup", json=payload)

    assert response.status_code == 400

    data = response.json()

    assert data["success"] is False
    assert data["message"] == "Validation failed"
    password_error = any(err["field"] == "password" for err in data["errors"])
    assert password_error is True


@pytest.mark.asyncio
async def test_signup_candidate_success(client):
    payload = {
        "full_name": "Test Candidate",
        "email": "candidate@test.com",
        "password": "password123",
        "primary_role": "candidate",
    }
    response = await client.post("/auth/signup", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "Account created. Please verify your email."

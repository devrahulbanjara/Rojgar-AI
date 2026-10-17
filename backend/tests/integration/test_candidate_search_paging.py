import app.infrastructures.qdrant.service as qdrant_mod
from tests.integration.helpers import (
    auth_headers,
    make_active_job,
    make_application,
    make_candidate_with_resume,
    make_recruiter_admin,
)


async def test_semantic_search_second_page_and_tenancy(client, db, monkeypatch):
    admin, company = await make_recruiter_admin(db, email="search_admin@example.com")
    _, other_company = await make_recruiter_admin(
        db, email="search_other@example.com", company_name="Other Co"
    )
    job = await make_active_job(db, company.id)
    foreign_job = await make_active_job(db, other_company.id)

    ours = []
    for i in range(3):
        user, resume = await make_candidate_with_resume(db, email=f"s{i}@example.com")
        application = await make_application(db, user.id, job.id, resume.id)
        application.share_email = i != 0
        application.shared_email_value = user.email
        ours.append(application)
    user, resume = await make_candidate_with_resume(db, email="foreign@example.com")
    foreign = await make_application(db, user.id, foreign_job.id, resume.id)
    await db.flush()

    hits = [
        {"application_id": a.id, "score": 0.9 - i * 0.1}
        for i, a in enumerate([ours[0], foreign, ours[1], ours[2]])
    ]

    async def fake_search(*, limit, **_kwargs):
        return hits[:limit]

    monkeypatch.setattr(qdrant_mod.qdrant_service, "search_applications", fake_search)

    page1 = await client.get(
        "/applications/company/me/candidates/search",
        params={"q": "python", "page": 1, "size": 2},
        headers=auth_headers(admin.id),
    )
    page2 = await client.get(
        "/applications/company/me/candidates/search",
        params={"q": "python", "page": 2, "size": 2},
        headers=auth_headers(admin.id),
    )

    assert page1.status_code == 200 and page2.status_code == 200
    first = page1.json()["data"]["candidates"]
    second = page2.json()["data"]["candidates"]
    ids = {
        c["applicationId"] if "applicationId" in c else c["application_id"]
        for c in first + second
    }
    assert str(foreign.id) not in ids  # other company's vector hit is dropped
    assert len(second) == 1
    assert first[0].get("applicant_email", first[0].get("applicantEmail")) is None

"""Job AI drafting must not read jobs from another company."""

from app.modules.job_ai.tools import get_source_job_context
from tests.integration.helpers import (
    auth_headers,
    make_active_job,
    make_recruiter_admin,
)


async def test_source_job_context_is_company_scoped(db):
    _, company_a = await make_recruiter_admin(db, "a@test.com", "Company A")
    _, company_b = await make_recruiter_admin(db, "b@test.com", "Company B")
    job_b = await make_active_job(db, company_b.id, salary_min=150000)

    assert await get_source_job_context(db, job_b.id, company_a.id) is None
    own = await get_source_job_context(db, job_b.id, company_b.id)
    assert own is not None and own["salary_min"] == 150000


async def test_clone_of_foreign_job_is_404(client, db):
    admin_a, _ = await make_recruiter_admin(db, "a2@test.com", "Company A2")
    _, company_b = await make_recruiter_admin(db, "b2@test.com", "Company B2")
    job_b = await make_active_job(db, company_b.id)
    await db.commit()

    resp = await client.post(
        "/jobs/ai/draft",
        json={"mode": "clone", "source_job_id": str(job_b.id)},
        headers=auth_headers(admin_a.id),
    )
    assert resp.status_code == 404, resp.text

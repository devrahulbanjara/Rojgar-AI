import uuid

from app.modules.audit.models import AuditLog
from tests.integration.helpers import (
    auth_headers,
    make_candidate,
    make_recruiter_admin,
)


async def _trail(db, entity_id, *, candidate_id, recruiter_id, company_id, other_co):
    db.add_all(
        [
            AuditLog(
                entity_type="application",
                entity_id=entity_id,
                action_type="update",
                actor_user_id=recruiter_id,
                actor_role="recruiter_admin",
                target_user_id=candidate_id,
                company_id=company_id,
                ip_address="203.0.113.7",
                user_agent="RecruiterBrowser/1.0",
                request_path="/applications/x/status",
                after_json={"status": "rejected", "internal_note": "secret"},
            ),
            AuditLog(
                entity_type="application",
                entity_id=entity_id,
                action_type="view",
                actor_user_id=uuid.uuid4(),
                company_id=other_co,
                ip_address="198.51.100.9",
            ),
        ]
    )
    await db.flush()


class TestAuditEntityTimeline:
    async def test_candidate_gets_reduced_rows(self, client, db):
        candidate = await make_candidate(db, email="audit_cand@example.com")
        recruiter, company = await make_recruiter_admin(
            db, email="audit_rec@example.com"
        )
        entity_id = str(uuid.uuid4())
        await _trail(
            db,
            entity_id,
            candidate_id=candidate.id,
            recruiter_id=recruiter.id,
            company_id=company.id,
            other_co=uuid.uuid4(),
        )

        resp = await client.get(
            f"/audit/entity/application/{entity_id}",
            headers=auth_headers(candidate.id),
        )

        assert resp.status_code == 200
        rows = resp.json()["data"]
        assert len(rows) == 1
        row = rows[0]
        assert row["ipAddress" if "ipAddress" in row else "ip_address"] is None
        for key, value in row.items():
            assert value != "203.0.113.7"
            assert value != "RecruiterBrowser/1.0"
            assert value != str(recruiter.id)
        assert "secret" not in str(row)

    async def test_recruiter_sees_only_own_company_rows(self, client, db):
        candidate = await make_candidate(db, email="audit_cand2@example.com")
        recruiter, company = await make_recruiter_admin(
            db, email="audit_rec2@example.com", company_name="Audit Co"
        )
        entity_id = str(uuid.uuid4())
        await _trail(
            db,
            entity_id,
            candidate_id=candidate.id,
            recruiter_id=recruiter.id,
            company_id=company.id,
            other_co=uuid.uuid4(),
        )

        resp = await client.get(
            f"/audit/entity/application/{entity_id}",
            headers=auth_headers(recruiter.id),
        )

        assert resp.status_code == 200
        assert "198.51.100.9" not in resp.text
        assert len(resp.json()["data"]) == 1

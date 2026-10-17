"""Businesses, roles and the guards around them."""

from datetime import UTC, datetime, timedelta

import pytest
from fastapi import HTTPException
from sqlalchemy import select

from app.modules.audit.models import AuditLog
from app.modules.auth.enums import BusinessStatus, MembershipRole, MembershipStatus
from app.modules.companies.models import BusinessInvite, Company, CompanyMembership
from app.modules.entitlements import service as entitlements
from app.modules.entitlements.plans import PlanId
from app.shared.nepal import DISTRICTS
from tests.integration.helpers import (
    auth_headers,
    make_active_job,
    make_candidate,
    make_member,
    make_platform_admin,
    make_recruiter_admin,
)

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


def _business_form(**overrides):
    data = {
        "name": "Sita Kirana Pasal",
        "business_type": "Shop or retail",
        "district": "Kaski",
        "phone": "9812345678",
    }
    data.update(overrides)
    return data


async def _create_business(client, user, files=None, **overrides):
    return await client.post(
        "/businesses",
        data=_business_form(**overrides),
        files=files,
        headers=auth_headers(user.id),
    )


def test_all_77_districts():
    assert len(DISTRICTS) == 77 and len(set(DISTRICTS)) == 77


class TestGuards:
    async def test_person_without_business_is_not_a_member(self, client, db):
        person = await make_candidate(db, email="p@test.com")
        resp = await client.get(
            "/dashboards/recruiter/home", headers=auth_headers(person.id)
        )
        assert resp.status_code == 403
        assert resp.json()["message"] == "You're not part of a business yet."

    async def test_interviewer_cannot_invite(self, client, db):
        _, company = await make_recruiter_admin(db)
        interviewer = await make_member(
            db, company.id, email="i@test.com", role=MembershipRole.interviewer
        )
        resp = await client.post(
            f"/businesses/{company.id}/invites",
            json={"role": "manager"},
            headers=auth_headers(interviewer.id),
        )
        assert resp.status_code == 403

    async def test_path_business_must_be_yours(self, client, db):
        owner, _ = await make_recruiter_admin(db)
        _, other = await make_recruiter_admin(
            db, email="other@test.com", company_name="Other"
        )
        resp = await client.get(
            f"/businesses/{other.id}/members", headers=auth_headers(owner.id)
        )
        assert resp.status_code == 403

    async def test_platform_admin_only(self, client, db):
        owner, _ = await make_recruiter_admin(db)
        staff = await make_platform_admin(db)
        denied = await client.get("/admin/approvals", headers=auth_headers(owner.id))
        allowed = await client.get("/admin/approvals", headers=auth_headers(staff.id))
        assert denied.status_code == 403
        assert allowed.status_code == 200

    async def test_me_lists_memberships_and_active_business(self, client, db):
        owner, company = await make_recruiter_admin(db)
        resp = await client.get("/auth/me", headers=auth_headers(owner.id))
        data = resp.json()["data"]
        assert data["is_platform_admin"] is False
        assert data["active_business"]["business_id"] == str(company.id)
        assert data["active_business"]["role"] == "owner"
        assert [m["business_name"] for m in data["memberships"]] == ["ACME Corp"]
        assert "primary_role" not in data


class TestCreateBusiness:
    async def test_creator_becomes_owner_of_pending_business(self, client, db):
        person = await make_candidate(db, email="new@test.com")
        resp = await _create_business(
            client,
            person,
            files={"registration_doc": ("cert.png", PNG, "image/png")},
            pan_number="123 456 789",
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()["data"]
        assert data["status"] == "pending" and data["verified"] is False
        assert data["pan_number"] == "123456789"
        assert data["phone"] == "+9779812345678"
        assert data["has_registration_doc"] is True

        membership = await db.scalar(
            select(CompanyMembership).where(CompanyMembership.user_id == person.id)
        )
        assert membership.role == MembershipRole.owner
        assert membership.status == MembershipStatus.active

    async def test_rejects_unknown_district_and_bad_pan(self, client, db):
        person = await make_candidate(db, email="new2@test.com")
        assert (
            await _create_business(client, person, district="Atlantis")
        ).status_code == 400
        assert (
            await _create_business(client, person, pan_number="12")
        ).status_code == 400

    async def test_rejects_non_document_upload(self, client, db):
        person = await make_candidate(db, email="new3@test.com")
        resp = await _create_business(
            client,
            person,
            files={"registration_doc": ("x.html", b"<html></html>", "image/png")},
        )
        assert resp.status_code == 400

    async def test_names_need_not_be_unique(self, client, db):
        await make_recruiter_admin(db, company_name="Sita Kirana Pasal")
        person = await make_candidate(db, email="twin@test.com")
        assert (await _create_business(client, person)).status_code == 201

    async def test_second_business_becomes_active(self, client, db):
        owner, first = await make_recruiter_admin(db)
        resp = await _create_business(client, owner, name="Second Shop")
        second_id = resp.json()["data"]["id"]
        me = (await client.get("/auth/me", headers=auth_headers(owner.id))).json()
        assert me["data"]["active_business"]["business_id"] == second_id
        assert len(me["data"]["memberships"]) == 2

        switched = await client.post(
            "/auth/me/active-business",
            json={"business_id": str(first.id)},
            headers=auth_headers(owner.id),
        )
        assert switched.json()["data"]["active_business"]["business_id"] == str(
            first.id
        )


class TestPublishing:
    async def test_pending_business_can_draft_but_not_publish(self, client, db):
        owner, _ = await make_recruiter_admin(
            db, business_status=BusinessStatus.pending
        )
        headers = auth_headers(owner.id)
        draft = await client.post(
            "/jobs/",
            json={"title": "Shop helper", "status": "draft"},
            headers=headers,
        )
        assert draft.status_code == 201, draft.text

        published = await client.patch(
            f"/jobs/{draft.json()['data']['id']}",
            json={"status": "active"},
            headers=headers,
        )
        assert published.status_code == 403
        assert published.json()["message"].startswith(
            "Your business is waiting for approval"
        )
        await db.rollback()  # the shared test session saw the failed flush

        direct = await client.post(
            "/jobs/",
            json={"title": "Cashier", "status": "active"},
            headers=headers,
        )
        assert direct.status_code == 403

    async def test_guard_holds_for_any_code_path(self, db):
        _, company = await make_recruiter_admin(
            db, business_status=BusinessStatus.suspended
        )
        with pytest.raises(HTTPException) as caught:
            await make_active_job(db, company.id)
        assert caught.value.status_code == 403

    async def test_active_business_publishes_and_shows_verified(self, client, db):
        owner, company = await make_recruiter_admin(db)
        job = await make_active_job(db, company.id)
        resp = await client.get(f"/public/jobs/{job.slug}")
        assert resp.status_code == 200
        assert resp.json()["data"]["company"]["verified"] is True


class TestTeam:
    async def test_invite_link_flow(self, client, db):
        owner, company = await make_recruiter_admin(db)
        await entitlements.set_plan(db, company.id, PlanId.team)
        created = await client.post(
            f"/businesses/{company.id}/invites",
            json={"role": "interviewer"},
            headers=auth_headers(owner.id),
        )
        assert created.status_code == 201
        url = created.json()["data"]["url"]
        token = url.rsplit("/", 1)[1]
        stored = await db.scalar(select(BusinessInvite))
        assert stored.token_hash != token and token not in stored.token_hash
        assert stored.expires_at - datetime.now(UTC) > timedelta(days=6)

        preview = await client.get(f"/invites/{token}")
        assert preview.json()["data"] == {
            "business_name": "ACME Corp",
            "role": "interviewer",
            "invited_by": "Test Admin",
            "problem": None,
        }

        person = await make_candidate(db, email="joiner@test.com")
        accepted = await client.post(
            f"/invites/{token}/accept", headers=auth_headers(person.id)
        )
        assert accepted.status_code == 200
        members = await client.get(
            f"/businesses/{company.id}/members", headers=auth_headers(person.id)
        )
        roles = {m["full_name"]: m["role"] for m in members.json()["data"]}
        assert roles == {"Test Admin": "owner", "Test Candidate": "interviewer"}

        reused = await client.post(
            f"/invites/{token}/accept",
            headers=auth_headers((await make_candidate(db, email="x@test.com")).id),
        )
        assert reused.status_code == 410

        audit = await db.scalar(
            select(AuditLog).where(AuditLog.action_type == "invite_accepted")
        )
        assert audit.company_id == company.id and audit.actor_user_id == person.id

    async def test_expired_and_revoked_invites(self, client, db):
        owner, company = await make_recruiter_admin(db)
        await entitlements.set_plan(db, company.id, PlanId.team)
        tokens = []
        for _ in range(2):
            resp = await client.post(
                f"/businesses/{company.id}/invites",
                json={"role": "manager"},
                headers=auth_headers(owner.id),
            )
            tokens.append(resp.json()["data"])
        expired = await db.scalar(
            select(BusinessInvite).where(BusinessInvite.id == tokens[0]["id"])
        )
        expired.expires_at = datetime.now(UTC) - timedelta(minutes=1)
        await db.flush()
        await client.delete(
            f"/businesses/{company.id}/invites/{tokens[1]['id']}",
            headers=auth_headers(owner.id),
        )

        person = await make_candidate(db, email="late@test.com")
        for invite in tokens:
            token = invite["url"].rsplit("/", 1)[1]
            resp = await client.post(
                f"/invites/{token}/accept", headers=auth_headers(person.id)
            )
            assert resp.status_code == 410
        listed = await client.get(
            f"/businesses/{company.id}/invites", headers=auth_headers(owner.id)
        )
        assert listed.json()["data"] == []

    async def test_owner_changes_role_and_keeps_one_owner(self, client, db):
        owner, company = await make_recruiter_admin(db)
        manager = await make_member(db, company.id, email="m@test.com")
        rows = (
            await client.get(
                f"/businesses/{company.id}/members", headers=auth_headers(owner.id)
            )
        ).json()["data"]
        ids = {r["full_name"]: r["membership_id"] for r in rows}

        last_owner = await client.patch(
            f"/businesses/{company.id}/members/{ids['Test Admin']}",
            json={"role": "manager"},
            headers=auth_headers(owner.id),
        )
        assert last_owner.status_code == 409

        promoted = await client.patch(
            f"/businesses/{company.id}/members/{ids['Test Manager']}",
            json={"role": "owner"},
            headers=auth_headers(owner.id),
        )
        assert promoted.json()["data"]["role"] == "owner"

        removed = await client.delete(
            f"/businesses/{company.id}/members/{ids['Test Admin']}",
            headers=auth_headers(manager.id),
        )
        assert removed.status_code == 200
        gone = await client.get("/companies/me", headers=auth_headers(owner.id))
        assert gone.status_code == 403

    async def test_manager_cannot_change_roles(self, client, db):
        _, company = await make_recruiter_admin(db)
        manager = await make_member(db, company.id, email="m2@test.com")
        membership = await db.scalar(
            select(CompanyMembership).where(CompanyMembership.user_id == manager.id)
        )
        resp = await client.patch(
            f"/businesses/{company.id}/members/{membership.id}",
            json={"role": "owner"},
            headers=auth_headers(manager.id),
        )
        assert resp.status_code == 403

    async def test_rejected_owner_resubmits_details(self, client, db):
        owner, company = await make_recruiter_admin(
            db, business_status=BusinessStatus.rejected
        )
        company.status_reason = "Certificate unreadable"
        await db.flush()
        resp = await client.post(
            f"/businesses/{company.id}/verification",
            files={"registration_doc": ("c.png", PNG, "image/png")},
            headers=auth_headers(owner.id),
        )
        assert resp.status_code == 200
        refreshed = await db.get(Company, company.id)
        assert refreshed.status == BusinessStatus.pending
        assert refreshed.status_reason is None

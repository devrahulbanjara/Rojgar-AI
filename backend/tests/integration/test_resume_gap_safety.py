"""Resume gap: ownership before cache, server-side gaps, evidence-checked patches."""

from datetime import date

import pytest

from app.modules.resume_gap import service as gap_service
from app.modules.resume_gap.schemas import (
    AutoPatchResult,
    ExperiencePatch,
    GapAnalysisResult,
)
from app.modules.resumes.models import ResumeExperience, ResumeSkill
from tests.integration.helpers import (
    auth_headers,
    make_active_job,
    make_candidate_with_resume,
    make_recruiter_admin,
)


@pytest.fixture(autouse=True)
def _no_live_guardrail(monkeypatch):
    monkeypatch.setattr(gap_service.guardrails_service, "_get_llm", lambda: None)


GAP = GapAnalysisResult(
    missing_skills=[],
    experience_gaps=[],
    things_to_add_to_summary=[],
    things_to_remove_or_deemphasize=[],
    things_already_strong=["Python"],
    overall_score_estimate=70,
    overall_verdict="Good fit.",
)


async def _setup(db):
    candidate, resume = await make_candidate_with_resume(db, "gap@test.com")
    resume.headline = "Backend engineer"
    resume.summary = "Builds Python APIs with FastAPI and PostgreSQL."
    db.add(ResumeSkill(resume_id=resume.id, skill_name="Python"))
    db.add(
        ResumeExperience(
            resume_id=resume.id,
            company_name="Driven Tech",
            title="Engineer",
            start_date=date(2022, 1, 1),
            description=["Built a FastAPI backend with PostgreSQL and Redis."],
        )
    )
    _, company = await make_recruiter_admin(db, "gapadmin@test.com")
    job = await make_active_job(db, company.id)
    await db.commit()
    return candidate, resume, job


async def test_cached_analysis_is_not_served_to_another_user(client, db, monkeypatch):
    calls = {"n": 0}

    async def fake_analyze(**_kwargs):
        calls["n"] += 1
        return GAP

    monkeypatch.setattr(gap_service._provider, "analyze_gaps", fake_analyze)
    owner, resume, job = await _setup(db)
    body = {"resume_id": str(resume.id), "job_id": str(job.id)}

    ok = await client.post(
        "/resume-gap/analyze", json=body, headers=auth_headers(owner.id)
    )
    assert ok.status_code == 200, ok.text

    intruder, _ = await make_candidate_with_resume(db, "intruder@test.com")
    await db.commit()
    resp = await client.post(
        "/resume-gap/analyze", json=body, headers=auth_headers(intruder.id)
    )
    assert resp.status_code == 404
    assert calls["n"] == 1


async def test_auto_patch_drops_unevidenced_skills_and_invented_metrics(
    client, db, monkeypatch
):
    async def fake_analyze(**_kwargs):
        return GAP

    async def fake_patch(*, resume_data, gap_result):
        assert gap_result == GAP  # server-side result, not the client's
        return AutoPatchResult(
            headline="Backend engineer | Python, FastAPI",
            summary="Scaled Kubernetes clusters to 10M users.",
            skills=["Python", "FastAPI", "Kafka"],
            experience_patches=[
                ExperiencePatch(
                    index=0,
                    description=["Cut latency by 40% on the FastAPI backend."],
                )
            ],
        )

    monkeypatch.setattr(gap_service._provider, "analyze_gaps", fake_analyze)
    monkeypatch.setattr(gap_service._provider, "build_patch", fake_patch)
    owner, resume, job = await _setup(db)

    poisoned_gap = GAP.model_copy(update={"things_already_strong": ["Rust"]})
    resp = await client.post(
        "/resume-gap/auto-patch",
        json={
            "resume_id": str(resume.id),
            "job_id": str(job.id),
            "gap_result": poisoned_gap.model_dump(),
        },
        headers=auth_headers(owner.id),
    )
    assert resp.status_code == 200, resp.text
    diffs = {d["field"]: d for d in resp.json()["data"]["diffs"]}
    assert "summary" not in diffs  # invented Kubernetes + 10M users
    assert "experience_0" not in diffs  # invented "40%"
    assert "Kafka" not in diffs["skills"]["new_value"]
    assert "FastAPI" in diffs["skills"]["new_value"]  # evidenced in resume text
    assert diffs["headline"]["new_value"] == "Backend engineer | Python, FastAPI"

"""Red-team tests for the resume-gap citation-span guardrail.

The guardrail (`filter_grounded` in `app.modules.resume_gap.helpers`) drops any
GapItem whose `evidence_span` does not literally appear in the declared source
(`resume` or `jd`). These tests simulate adversarial / hallucinating LLM output
and assert that fabricated claims are dropped while legitimate claims survive.
"""

from app.modules.resume_gap.helpers import filter_grounded
from app.modules.resume_gap.schemas import GapItem


RESUME = {
    "headline": "Backend engineer",
    "summary": "Three years building async Python services on AWS.",
    "skills": ["Python", "FastAPI", "PostgreSQL", "Redis"],
    "experiences": [
        {
            "index": 0,
            "company": "Driven Tech",
            "title": "Backend Engineer",
            "start": "2023-01-01",
            "end": "present",
            "description": [
                "Built a FastAPI backend with PostgreSQL and Redis.",
                "Wrote async SQLAlchemy queries and deployed on AWS EC2.",
            ],
        }
    ],
    "educations": [
        {
            "index": 0,
            "institution": "Kathmandu University",
            "degree": "BSc",
            "field": "Computer Science",
        }
    ],
}

JOB = {
    "title": "Senior Backend Engineer",
    "overview": "Cloud-native team building event-driven services.",
    "requirements": [
        "Kubernetes and Kafka experience",
        "Strong Python and FastAPI",
    ],
    "preferred_qualifications": ["Experience with PostgreSQL"],
    "responsibilities": ["Own backend services end to end"],
}


def _item(area: str, span: str, source: str) -> GapItem:
    return GapItem(
        area=area,
        severity="high",
        suggestion=f"Add {area}.",
        evidence_span=span,
        evidence_source=source,  # type: ignore[arg-type]
    )


class TestCitationSpanGuardrail:
    def test_legitimate_jd_claim_survives(self):
        items = [_item("Kubernetes", "Kubernetes and Kafka experience", "jd")]
        kept, dropped = filter_grounded(items, RESUME, JOB)
        assert [i.area for i in kept] == ["Kubernetes"]
        assert dropped == []

    def test_fabricated_jd_claim_dropped(self):
        # LLM invents "containerization with Docker" — not present in JD.
        items = [_item("Docker", "containerization with Docker", "jd")]
        kept, dropped = filter_grounded(items, RESUME, JOB)
        assert kept == []
        assert [i.area for i in dropped] == ["Docker"]

    def test_fabricated_resume_claim_dropped(self):
        # LLM claims resume mentions GraphQL — it does not.
        items = [_item("GraphQL", "built GraphQL services for 5 years", "resume")]
        kept, dropped = filter_grounded(items, RESUME, JOB)
        assert kept == []
        assert [i.area for i in dropped] == ["GraphQL"]

    def test_mixed_batch_partially_dropped(self):
        items = [
            _item("Kubernetes", "Kubernetes and Kafka experience", "jd"),  # ok
            _item("Kafka", "Kubernetes and Kafka experience", "jd"),  # ok
            _item("Docker", "containerization with Docker", "jd"),  # halluc
            _item("GraphQL", "built GraphQL services for 5 years", "resume"),  # halluc
            _item("PostgreSQL", "Experience with PostgreSQL", "jd"),  # ok
        ]
        kept, dropped = filter_grounded(items, RESUME, JOB)
        assert sorted(i.area for i in kept) == ["Kafka", "Kubernetes", "PostgreSQL"]
        assert sorted(i.area for i in dropped) == ["Docker", "GraphQL"]

    def test_whitespace_and_case_tolerated(self):
        # LLM may reformat whitespace / case while keeping content faithful.
        items = [_item("Kubernetes", "  KUBERNETES   and   Kafka experience\n", "jd")]
        kept, dropped = filter_grounded(items, RESUME, JOB)
        assert [i.area for i in kept] == ["Kubernetes"]
        assert dropped == []

    def test_paraphrase_dropped(self):
        # LLM paraphrases instead of quoting. Substring check must fail.
        items = [_item("Kubernetes", "needs container orchestration with K8s", "jd")]
        kept, dropped = filter_grounded(items, RESUME, JOB)
        assert kept == []
        assert [i.area for i in dropped] == ["Kubernetes"]

    def test_wrong_source_dropped(self):
        # Quote is real but LLM attributes it to the wrong document.
        # "Kubernetes and Kafka experience" is in the JD, not the resume.
        items = [_item("Kubernetes", "Kubernetes and Kafka experience", "resume")]
        kept, dropped = filter_grounded(items, RESUME, JOB)
        assert kept == []
        assert [i.area for i in dropped] == ["Kubernetes"]

    def test_empty_evidence_dropped(self):
        # LLM claims a source but leaves the span blank.
        items = [_item("Kubernetes", "", "jd")]
        kept, dropped = filter_grounded(items, RESUME, JOB)
        assert kept == []
        assert [i.area for i in dropped] == ["Kubernetes"]

    def test_unevidenced_item_is_dropped(self):
        # An item with no evidence source cannot be verified, so it is dropped;
        # otherwise the model could bypass grounding by leaving it blank.
        unevidenced = GapItem(area="Legacy", severity="low", suggestion="…")
        kept, dropped = filter_grounded([unevidenced], RESUME, JOB)
        assert kept == []
        assert [i.area for i in dropped] == ["Legacy"]

    def test_partial_substring_in_long_resume_bullet(self):
        # Item quotes a real fragment from inside a resume bullet.
        items = [_item("AWS EC2", "deployed on AWS EC2", "resume")]
        kept, dropped = filter_grounded(items, RESUME, JOB)
        assert [i.area for i in kept] == ["AWS EC2"]

    def test_skill_only_evidence_from_resume_skills_array(self):
        # Skill list is folded into resume grounding text.
        items = [_item("Python", "Python", "resume")]
        kept, dropped = filter_grounded(items, RESUME, JOB)
        assert [i.area for i in kept] == ["Python"]

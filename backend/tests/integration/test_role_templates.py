"""Protected-ground warnings and role templates (pure functions, no DB)."""

import pytest

from app.modules.jobs.protected_grounds import (
    check_protected_grounds,
    protected_grounds_in,
)
from app.modules.jobs.role_templates import (
    ROLE_TEMPLATES,
    RoleTemplate,
    list_templates,
)
from app.shared.enums import JobCategory

FLAGGED = {
    "Female receptionist": "gender",
    "male only": "gender",
    "girls preferred": "gender",
    "महिला मात्र": "gender",
    "Brahmin only": "caste_ethnicity",
    "Newar candidates": "caste_ethnicity",
    "ब्राह्मण": "caste_ethnicity",
    "Hindu": "religion",
    "unmarried": "marital_status",
    "married women": "marital_status",
    "अविवाहित": "marital_status",
    "age 18-25": "age",
    "below 30 years old": "age",
    "under 35 years of age": "age",
    "उमेर २५ भन्दा कम": "age",
    "good looking": "appearance",
    "fair complexion": "appearance",
    "not pregnant": "pregnancy_family",
    "no disability": "disability",
    "Nepali citizens only": "origin",
    "only locals": "origin",
    "from Kathmandu only": "origin",
}

ALLOWED = [
    "Valid driving licence (category B)",
    "Night shift availability",
    "NNC registration",
    "TSC teaching licence",
    "3+ years of experience",
    "18 years or older",
    "at least 18 years old",
    "Can lift 20 kg",
    "Fluent in Nepali and English",
    "SEE pass",
    "Bachelor in Nursing",
    "Experience in a women's health ward",
    "Worked with persons with disabilities",
    "प्रजातन्त्र र सुशासन विषयमा ज्ञान",
]


@pytest.mark.parametrize("text,ground", FLAGGED.items())
def test_protected_grounds_flagged(text, ground):
    assert ground in protected_grounds_in(text)


@pytest.mark.parametrize("text", ALLOWED)
def test_genuine_requirements_not_flagged(text):
    assert protected_grounds_in(text) == []


def test_check_protected_grounds_reports_field_and_index():
    warnings = check_protected_grounds(
        ["3+ years of experience", "Female only"],
        ["Unmarried preferred"],
        [{"label": "What is your caste?", "type": "short_text", "required": True}],
    )
    got = {(w.field, w.index, w.ground) for w in warnings}
    assert got == {
        ("must_haves", 1, "gender"),
        ("nice_to_haves", 0, "marital_status"),
        ("questions", 0, "caste_ethnicity"),
    }
    assert all(w.message for w in warnings)


def test_check_protected_grounds_handles_empty():
    assert check_protected_grounds(None, None, None) == []


def test_templates_are_valid_and_clean():
    assert len(ROLE_TEMPLATES) >= 25
    keys = [t["key"] for t in ROLE_TEMPLATES]
    assert len(keys) == len(set(keys))
    for raw in ROLE_TEMPLATES:
        template = RoleTemplate.model_validate(raw)
        assert 3 <= len(template.must_haves) <= 5, template.key
        assert len(template.nice_to_haves) <= 3, template.key
        assert 1 <= len(template.questions) <= 3, template.key
        assert 17300 <= template.salary_min <= template.salary_max, template.key
        for q in template.questions:
            if q.knockout_answer is not None:
                assert q.type == "yes_no", template.key
        assert (
            check_protected_grounds(
                template.must_haves,
                template.nice_to_haves,
                [q.model_dump() for q in template.questions],
            )
            == []
        ), template.key


def test_list_templates_by_category():
    nurses = list_templates(JobCategory.healthcare)
    assert nurses and all(t["category"] == "healthcare" for t in nurses)
    assert len(list_templates()) == len(ROLE_TEMPLATES)

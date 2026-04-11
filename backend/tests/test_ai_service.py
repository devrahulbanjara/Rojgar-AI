from pydantic import BaseModel, Field

from app.infrastructures.ai.service import _to_groq_strict_json_schema
from app.modules.job_ai.schemas import JobDraft


class _NestedFilters(BaseModel):
    enabled: bool = False
    threshold: int = Field(default=70, ge=0, le=100)


class _Envelope(BaseModel):
    name: str
    filters: _NestedFilters


def test_groq_strict_schema_requires_defaulted_job_draft_fields():
    schema = _to_groq_strict_json_schema(JobDraft)

    assert "auto_shortlist" in schema["required"]
    assert "shortlist_threshold" in schema["required"]
    assert schema["additionalProperties"] is False


def test_groq_strict_schema_recurses_into_nested_objects():
    schema = _to_groq_strict_json_schema(_Envelope)
    nested_schema = schema["$defs"]["_NestedFilters"]

    assert "enabled" in nested_schema["required"]
    assert "threshold" in nested_schema["required"]
    assert nested_schema["additionalProperties"] is False

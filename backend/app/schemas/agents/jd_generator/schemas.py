from typing import TypedDict

from pydantic import BaseModel


class JobDescription(BaseModel):
    job_summary: str
    job_responsibilities: list[str]
    required_qualifications: list[str]
    preferred: list[str]
    compensation_and_benefits: list[str]


class JobState(TypedDict):
    title: str
    raw_requirements: str
    reference_jd: str
    draft: JobDescription | None
    feedback: str
    revision_count: int

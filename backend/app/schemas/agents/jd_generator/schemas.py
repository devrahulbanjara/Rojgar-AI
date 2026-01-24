from typing import TypedDict

from pydantic import BaseModel


class JobDescription(BaseModel):
    """
    Output Schema for the Job Description Generation LLM
    """
    job_summary: str
    job_responsibilities: list[str]
    required_qualifications: list[str]
    preferred: list[str]
    compensation_and_benefits: list[str]


class JobState(TypedDict):
    title: str
    requirements: str
    format_reference: str
    draft: JobDescription | None
    feedback: str
    revision_count: int

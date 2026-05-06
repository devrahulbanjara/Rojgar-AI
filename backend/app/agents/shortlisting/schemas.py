from __future__ import annotations

import operator
from typing import Annotated, TypedDict

from pydantic import BaseModel, Field


class PersonaEvaluation(BaseModel):
    reason: str = Field(min_length=1)
    strengths: list[str] = Field(default_factory=list)
    concerns: list[str] = Field(default_factory=list)
    evidence: list[str] = Field(default_factory=list)
    search_notes: list[str] = Field(default_factory=list)


class JudgeResponse(BaseModel):
    is_satisfied: bool
    critique: str = Field(min_length=1)


class FinalResponse(BaseModel):
    strengths: list[str] | None = Field(default=None)
    weaknesses: list[str] | None = Field(default=None)


class ShortlistState(TypedDict):
    applicant_name: str
    job_title: str
    jd: str
    resume: str
    max_iterations: int
    iteration: int
    cto_evals: Annotated[list[PersonaEvaluation], operator.add]
    hr_evals: Annotated[list[PersonaEvaluation], operator.add]
    critiques: Annotated[list[str], operator.add]
    is_satisfied: bool
    final_strengths: list[str] | None
    final_weaknesses: list[str] | None

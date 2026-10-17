from __future__ import annotations

import operator
from typing import Annotated, TypedDict

from pydantic import BaseModel, Field, StringConstraints

ShortItem = Annotated[str, StringConstraints(min_length=1, max_length=120)]


class PersonaEvaluation(BaseModel):
    strengths: list[ShortItem] = Field(default_factory=list, max_length=4)
    concerns: list[ShortItem] = Field(default_factory=list, max_length=4)
    evidence: list[ShortItem] = Field(default_factory=list, max_length=4)


class JudgeResponse(BaseModel):
    is_satisfied: bool
    confidence: float = Field(ge=0.0, le=1.0)
    critique: Annotated[str, StringConstraints(min_length=1, max_length=400)]


class FinalResponse(BaseModel):
    strengths: list[ShortItem] | None = Field(default=None, max_length=6)
    weaknesses: list[ShortItem] | None = Field(default=None, max_length=6)


class ShortlistState(TypedDict):
    # Opaque reference (application id) used for logs and tool caching; never the
    # candidate's name, so names stay out of logs and traces.
    application_ref: str
    job_title: str
    jd: str
    resume: str
    max_iterations: int
    iteration: int
    cto_evals: Annotated[list[PersonaEvaluation], operator.add]
    hr_evals: Annotated[list[PersonaEvaluation], operator.add]
    critiques: Annotated[list[str], operator.add]
    is_satisfied: bool
    confidence: float
    final_strengths: list[str] | None
    final_weaknesses: list[str] | None

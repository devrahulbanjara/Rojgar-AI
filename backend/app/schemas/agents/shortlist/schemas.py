import operator
from typing import Annotated, TypedDict

from pydantic import BaseModel, Field


class PersonasResponse(BaseModel):
    score: int = Field(description="Score from 0 to 100", ge=0, le=100)
    reason: str = Field(description="A concise 1-sentence justification of the score.")


class JudgeResponse(BaseModel):
    critique: str = Field(
        description="Specific feedback to improve the next iteration."
    )
    is_satisfied: bool = Field(
        description="True if evaluations are thorough and consistent."
    )


class FinalResponse(BaseModel):
    score: int
    reason: str


class ShortlistState(TypedDict):
    jd: str
    resume: str
    iteration: int
    max_iterations: int
    cto_evals: Annotated[list[PersonasResponse], operator.add]
    hr_evals: Annotated[list[PersonasResponse], operator.add]
    critiques: Annotated[list[str], operator.add]
    is_satisfied: bool
    final_score: int | None
    final_reason: str | None

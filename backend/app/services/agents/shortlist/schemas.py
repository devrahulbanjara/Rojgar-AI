from typing import List, Dict, Any, TypedDict, Optional, Annotated
from operator import add
from pydantic import BaseModel, Field


class ResumeStructured(BaseModel):
    skills: List[str]
    work_experience: List[Dict[str, Any]]
    education: List[Dict[str, Any]]
    years_experience: float
    projects: Optional[List[Dict[str, Any]]] = Field(default_factory=list)


class JobRequirements(BaseModel):
    required_skills: List[str]
    min_degree: str
    years_required: float


class EvaluationScore(BaseModel):
    score: float = Field(description="A score from 0 to 10")
    justification: str


class CandidateScore(BaseModel):
    source_file: str
    final_score: float
    breakdown: Dict[str, Any]


class WorkflowState(TypedDict):
    job_description_text: str
    resume_file_paths: List[str]
    job_requirements: Optional[JobRequirements]
    structured_resumes: Annotated[List[Dict[str, Any]], add]
    skills_evaluations: Annotated[List[Dict[str, Any]], add]
    experience_evaluations: Annotated[List[Dict[str, Any]], add]
    work_alignment_evaluations: Annotated[List[Dict[str, Any]], add]
    project_evaluations: Annotated[List[Dict[str, Any]], add]
    degree_evaluations: Annotated[List[Dict[str, Any]], add]
    scored_candidates: List[CandidateScore]
    final_report: Optional[Dict[str, Any]]
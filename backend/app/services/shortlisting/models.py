from typing import List, Dict, Any, TypedDict
from pydantic import BaseModel


class ResumeStructured(BaseModel):
    name: str
    contact: Dict[str, str]
    skills: List[str]
    work_experience: List[Dict[str, str]]
    education: List[Dict[str, str]]
    years_experience: float


class NormalizedResume(BaseModel):
    source_file: str
    name: str
    skills: List[str]
    qualification: str
    years_experience: float


class JobRequirements(BaseModel):
    required_skills: List[str]
    min_degree: str
    years_required: float


class CandidateScore(BaseModel):
    source_file: str
    name: str
    experience_score: float
    qualification_score: float
    skills_score: float
    final_score: float
    breakdown: Dict[str, Any]


class WorkflowState(TypedDict, total=False):
    job_description_path: str
    resume_file_paths: List[str]
    job_requirements: JobRequirements
    structured_resumes: List[Dict[str, Any]]
    normalized_resumes: List[NormalizedResume]
    scored_candidates: List[CandidateScore]
    final_report: Dict[str, Any]

from typing import Annotated, Any, TypedDict, Optional
from operator import add
from pydantic import BaseModel, Field

class WorkExperience(BaseModel):
    company: str = Field(..., description="Name of the company")
    position: str = Field(..., description="Job title")
    duration: str = Field(..., description="Employment dates, e.g., 'Jan 2020 - Present'")
    responsibilities: list[str] = Field(default_factory=list, description="List of key duties")

class Education(BaseModel):
    degree: str = Field(..., description="Name of the degree")
    institution: str = Field(..., description="University or school name")
    year: Optional[int] = Field(None, description="Year of graduation if available")

class Project(BaseModel):
    name: str = Field(..., description="Project title")
    description: str = Field(..., description="Short summary of the project")
    technologies: list[str] = Field(default_factory=list, description="Tech stack used")

class ResumeStructured(BaseModel):
    skills: list[str] = Field(..., description="Technical and professional skills")
    work_experience: list[WorkExperience] = Field(..., description="Detailed work history")
    education: list[Education] = Field(..., description="Educational background")
    years_experience: float = Field(..., description="Total sum of professional experience in years")
    projects: list[Project] = Field(default_factory=list, description="Relevant projects")

class JobRequirements(BaseModel):
    required_skills: list[str] = Field(..., description="Skills mandatory for the role")
    min_degree: str = Field(..., description="Minimum required education")
    years_required: float = Field(..., description="Minimum years of experience required")
    responsibilities: list[str] = Field(..., description="Key job duties")

class EvaluationScore(BaseModel):
    score: float = Field(..., ge=0, le=10)
    justification: str = Field(...)

class CandidateBreakdown(BaseModel):
    skills: EvaluationScore
    experience_years: EvaluationScore
    work_experience_alignment: EvaluationScore
    project_alignment: EvaluationScore
    qualification: EvaluationScore

class CandidateScore(BaseModel):
    source_file: str
    final_score: float
    breakdown: CandidateBreakdown

class WorkflowState(TypedDict):
    job_description_text: str
    resume_file_path: str
    job_requirements: Optional[JobRequirements]
    structured_resumes: Annotated[list[dict[str, Any]], add] 
    skills_evaluations: Annotated[list[dict[str, Any]], add]
    experience_evaluations: Annotated[list[dict[str, Any]], add]
    work_alignment_evaluations: Annotated[list[dict[str, Any]], add]
    project_evaluations: Annotated[list[dict[str, Any]], add]
    degree_evaluations: Annotated[list[dict[str, Any]], add]
    scored_candidates: list[CandidateScore]
    final_report: Optional[dict[str, Any]]
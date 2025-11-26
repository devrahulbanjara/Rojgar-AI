from typing import List, Dict, Any, TypedDict, Optional, Annotated
from operator import add
from pydantic import BaseModel, Field


class ResumeStructured(BaseModel):
    skills: List[str] = Field(
        ...,
        description=(
            "All technical and professional skills mentioned in the resume, "
            "including programming languages, frameworks, tools, platforms, and methodologies."
        ),
        example=[
            "Python",
            "FastAPI",
            "PostgreSQL",
            "Finetuning Foundational Models",
            "AWS",
            "REST APIs",
        ],
    )
    work_experience: List[Dict[str, Any]] = Field(
        ...,
        description=(
            "List of previous jobs with company, position, duration, and key responsibilities. "
            "Only 'duration' is numeric-free; all other fields are strings."
        ),
        example=[
            {
                "company": "XYZ Corp",
                "position": "Backend Engineer",
                "duration": "Jun 2020 - Mar 2024",
                "responsibilities": [
                    "Developed REST APIs using FastAPI",
                    "Maintained PostgreSQL databases",
                    "Deployed containerized applications on AWS",
                ],
            },
            {
                "company": "ABC Solutions",
                "position": "Software Developer",
                "duration": "Jan 2018 - May 2020",
                "responsibilities": [
                    "Built internal tools in Python",
                    "Collaborated with frontend team using React",
                ],
            },
        ],
    )
    education: List[Dict[str, Any]] = Field(
        ...,
        description=(
            "List of educational qualifications with degree name, institution, and optional year of graduation."
        ),
        example=[
            {
                "degree": "BSc Computer Science",
                "institution": "ABC University",
                "year": 2018,
            }
        ],
    )
    years_experience: float = Field(
        ...,
        description=(
            "Total professional experience in years, calculated by summing all work experience durations."
        ),
        example=5.0,
    )
    projects: Optional[List[Dict[str, Any]]] = Field(
        default_factory=list,
        description=(
            "List of candidate projects with name, description, and technologies used. "
            "Leave empty if no projects are listed."
        ),
        example=[
            {
                "name": "Recommendation Engine",
                "description": "Developed an internal recommendation engine for products using Python and FastAPI.",
                "technologies": ["Python", "FastAPI", "PostgreSQL"],
            }
        ],
    )


class JobRequirements(BaseModel):
    required_skills: List[str] = Field(
        ...,
        description=(
            "All technical and professional skills required for the role, "
            "including programming languages, frameworks, tools, platforms, and domain-specific skills."
        ),
        example=["Python", "FastAPI", "Docker", "AWS", "REST APIs", "Data Analysis"],
    )
    min_degree: str = Field(
        ...,
        description=(
            "Minimum educational qualification required for the role. "
            "E.g., BSc Computer Science, BE Computer Engineering, MBA, etc."
        ),
        example="BSc Computer Science",
    )
    years_required: float = Field(
        ...,
        description=(
            "Minimum years of professional experience required. "
            "If not explicitly mentioned in the JD, infer based on role level (Junior=0-2, Mid=3-5, Senior=5-8, Lead=8+)."
        ),
        example=3.0,
    )
    responsibilities: List[str] = Field(
        ...,
        description=(
            "Key responsibilities the candidate will be expected to perform in this role. "
            "Each responsibility should be a distinct string."
        ),
        example=[
            "Design and implement REST APIs using Python and FastAPI",
            "Maintain and optimize PostgreSQL databases",
            "Deploy and monitor applications on AWS",
        ],
    )


class EvaluationScore(BaseModel):
    score: float = Field(
        ...,
        ge=0,
        le=10,
        description=(
            "A numeric evaluation score between 0 and 10 indicating how well a candidate's "
            "work experience or projects align with the job requirements."
        ),
        example=8.5,
    )
    justification: str = Field(
        ...,
        description=(
            "A clear and concise explanation of the score, citing specific details from the candidate's "
            "work experience or projects in relation to the job description. "
            "Should be 2-4 sentences and actionable."
        ),
        example=(
            "The candidate's previous roles demonstrate strong alignment with the required responsibilities, "
            "including hands-on experience with Python, FastAPI, and AWS. "
            "Career progression shows increasing responsibility and relevant industry exposure."
        ),
    )



class EvaluationScore(BaseModel):
    score: float = Field(..., ge=0, le=10, description="A numeric score between 0-10")
    justification: str = Field(..., description="Concise explanation justifying the score")

class CandidateBreakdown(BaseModel):
    skills: EvaluationScore = Field(..., description="Skills evaluation with score and justification")
    experience_years: EvaluationScore = Field(..., description="Work experience duration evaluation")
    work_experience_alignment: EvaluationScore = Field(..., description="Alignment of previous roles with job requirements")
    project_alignment: EvaluationScore = Field(..., description="Evaluation of candidate's projects for relevance")
    qualification: EvaluationScore = Field(..., description="Educational qualification assessment")

class CandidateScore(BaseModel):
    source_file: str = Field(..., description="Filename of the candidate's resume")
    final_score: float = Field(..., description="Aggregated final score from all evaluation categories")
    breakdown: CandidateBreakdown = Field(..., description="Detailed evaluation breakdown for each scoring category")



class WorkflowState(TypedDict):
    """
    Represents the state  of the entire workflow.
    """

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

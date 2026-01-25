from typing import Literal, TypedDict

from app.schemas.messages import BaseMessage
from pydantic import BaseModel, Field


class JobRequirements(BaseModel):
    job_title: str = Field(description="Primary job title/role")
    required_experience_years: float = Field(
        description="Minimum years of experience required", ge=0.0
    )
    must_have_skills: list[str] = Field(
        description="Critical technical skills that are mandatory, includes specific tools, platforms, or technologies mentioned"
    )
    nice_to_have_skills: list[str] = Field(
        default_factory=list, description="Preferred but not mandatory skills"
    )
    required_education: str = Field(
        default="Bachelor's degree", description="Minimum education requirement"
    )
    certifications_preferred: list[str] = Field(
        default_factory=list, description="Any certifications mentioned"
    )
    responsibilities: list[str] = Field(
        default_factory=list, description="Key job responsibilities"
    )
    soft_skills: list[str] = Field(
        default_factory=list, description="Soft skills or behavioral traits required"
    )


class WorkHistoryItem(BaseModel):
    role: str
    company: str
    start_date: str
    end_date: str
    duration_months: int
    key_responsibilities: list[str] = Field(default_factory=list)


class ResumeProfile(BaseModel):
    total_experience_years: float = Field(
        description="Total professional work experience in years, including internships and full-time roles."
    )

    work_history: list[WorkHistoryItem] = Field(
        description="Chronological list of previous roles, including job title, company, duration, and key contributions."
    )

    technical_skills: list[str] = Field(
        description="Concrete technical skills, tools, frameworks, programming languages, and platforms the candidate has hands-on experience with."
    )

    certifications: list[str] = Field(
        default_factory=list,
        description="Professional or academic certifications explicitly mentioned by the candidate.",
    )

    education_degree: str = Field(
        description="Highest degree obtained or currently being pursued by the candidate."
    )

    education_institution: str = Field(
        description="Name of the educational institution where the degree was obtained or is currently being pursued."
    )

    is_currently_student: bool = Field(
        description="Indicates whether the candidate is currently enrolled as a student."
    )

    notable_projects: list[str] = Field(
        default_factory=list,
        description=(
            "Concise, impact-focused descriptions of notable projects completed by the candidate. "
            "Each entry should mention the business or real-world problem solved, key technologies used, "
            "and any architectural or system-level decisions involved."
        ),
    )


class ResearchFindings(BaseModel):
    findings: list[str] = Field(description="Key research findings from web search")
    verified_claims: dict[str, str] = Field(
        default_factory=dict,
        description="Claims and their verification status as 'verified' or 'unverified'",
    )
    red_flags: list[str] = Field(default_factory=list)
    confidence_score: float = Field(ge=0.0, le=1.0)


class TechnicalEvaluation(BaseModel):
    technical_fit_score: float = Field(
        ge=0.0, le=10.0, description="Technical skills match score out of 10"
    )
    experience_adequacy: Literal["EXCEEDS", "MEETS", "BELOW"] = Field(
        description="Does experience meet JD requirement?"
    )
    skills_gap_analysis: list[str] = Field(description="Missing or weak areas")
    strengths: list[str] = Field(description="Technical strengths matching JD")
    research_findings: ResearchFindings
    reasoning: str = Field(description="Detailed technical assessment")


class HREvaluation(BaseModel):
    culture_fit_score: float = Field(
        ge=0.0, le=10.0, description="Career progression and stability score out of 10"
    )
    career_trajectory: str = Field(description="Assessment of career growth pattern")
    red_flags: list[str] = Field(default_factory=list)
    positive_indicators: list[str] = Field(default_factory=list)
    research_findings: ResearchFindings
    reasoning: str = Field(description="Detailed HR assessment")


class CritiqueReport(BaseModel):
    requires_rework: bool
    technical_gaps: list[str] = Field(default_factory=list)
    hr_gaps: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(description="What to investigate further")
    confidence_level: Literal["HIGH", "MEDIUM", "LOW"]


class FinalReport(BaseModel):
    final_score: float = Field(
        ge=0.0, le=10.0, description="Weighted final score out of 10"
    )
    decision: Literal["SHORTLIST", "MAYBE", "REJECT"]
    technical_score: float
    hr_score: float
    score_breakdown: dict[str, float] = Field(description="Detailed score components")
    justification: str = Field(
        description="Comprehensive justification for the decision"
    )
    key_strengths: list[str]
    key_concerns: list[str]
    recommendation: str = Field(description="Next steps recommendation")


class AgentState(TypedDict):
    resume_path: str
    jd_text: str
    jd_requirements: JobRequirements | None
    anonymized_text: str
    profile: ResumeProfile | None
    tech_eval: TechnicalEvaluation | None
    hr_eval: HREvaluation | None
    tech_messages: list[BaseMessage]
    hr_messages: list[BaseMessage]
    tech_done: bool
    hr_done: bool
    critique: CritiqueReport | None
    iteration: int
    max_iterations: int
    final_report: FinalReport | None

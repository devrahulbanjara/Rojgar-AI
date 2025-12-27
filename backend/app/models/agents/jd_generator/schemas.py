from typing import Annotated, TypedDict

from pydantic import BaseModel, Field


class JDGenNode(BaseModel):
    """Complete job description with all required sections."""

    about_the_company: str = Field(
        description="2-3 sentences about the company's mission, products, and culture"
    )

    job_title: str = Field(
        description="A professional and concise job title for the role"
    )

    role_overview: str = Field(
        description="2-4 sentences describing the position, responsibilities, and impact"
    )

    required_skills_and_experience: list[str] = Field(
        description="5-12 bullet points of mandatory qualifications (years of experience, technical skills, domain knowledge)"
    )

    nice_to_have: list[str] = Field(
        description="3-8 bullet points of preferred but optional qualifications"
    )

    what_company_offers: list[str] = Field(
        description="4-10 bullet points covering compensation, benefits, work environment, and growth opportunities"
    )


class JobState(TypedDict):
    """
    State schema for the job description generation workflow.

    Tracks the entire lifecycle of JD creation from initial requirements
    through human review cycles to final approval.
    """

    requirements: Annotated[
        str,
        "Initial job requirements provided by the user (role, experience, salary, etc.)",
    ]
    format_reference: Annotated[
        str, "Example job description to use as a style and format reference"
    ]
    draft: Annotated[
        JDGenNode | None,
        "Current draft of the job description (None before first generation)",
    ]
    feedback: Annotated[str, "Human feedback for revision or 'approve' to finalize"]
    revision_count: Annotated[
        int, "Number of times the draft has been generated or revised"
    ]
    final_doc: Annotated[
        str | None, "Final approved job description in markdown format"
    ]

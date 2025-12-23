from typing import Any

from pydantic import BaseModel


class CompanyResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    location: str | None = None
    website: str | None = None
    industry: str | None = None
    founded_year: int | None = None

    class Config:
        from_attributes = True


class JobResponse(BaseModel):
    job_id: str
    id: str
    company_id: str
    job_description_id: str

    title: str
    department: str | None = None
    level: str | None = None

    location: str | None = None
    location_city: str | None = None
    location_country: str | None = None
    is_remote: bool = False
    location_type: str | None = None

    employment_type: str | None = "Full-time"

    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str | None = "USD"
    salary_range: dict[str, Any] | None = None

    status: str = "active"
    posted_date: str | None = None
    application_deadline: str | None = None
    created_at: str | None = None
    updated_at: str | None = None

    company: CompanyResponse | None = None
    company_name: str | None = None

    description: str | None = None
    role_overview: str | None = None

    skills: list[str] = []
    required_skills: dict[str, Any] | None = None

    requirements: list[str] = []
    benefits: list[str] = []
    nice_to_have: list[str] = []
    applicant_count: int = 0
    views_count: int = 0
    is_featured: bool = False

    class Config:
        from_attributes = True
        populate_by_name = True


class JobListResponse(BaseModel):
    jobs: list[JobResponse]
    total: int
    page: int
    limit: int
    total_pages: int
    has_next: bool
    has_prev: bool


class JobCreate(BaseModel):
    """Schema for creating a new job posting"""

    title: str
    department: str | None = None
    level: str | None = None

    # Job Description fields
    description: str | None = ""  # role_overview - optional for drafts
    requiredSkillsAndExperience: (
        list[str] | None
    ) = []  # Will be stored as {"required_skills_experience": [...]} - optional for drafts
    niceToHave: list[str] | None = None  # Will be stored as {"nice_to_have": [...]}
    benefits: list[str] | None = None  # Will be stored as {"benefits": [...]} in offers

    # Location
    locationCity: str | None = None
    locationCountry: str | None = None
    locationType: str = "On-site"  # Remote, On-site, Hybrid
    employmentType: str | None = None

    # Compensation
    salaryMin: int | None = None
    salaryMax: int | None = None
    currency: str | None = "NPR"

    # Dates
    applicationDeadline: str | None = None  # ISO date string

    # Status
    status: str | None = "active"  # "active", "draft", "expired"

    # Creation Mode
    mode: str = "manual"  # "manual", "agent"
    raw_requirements: str | None = None  # Required if mode is "agent"


class JobDraftGenerateRequest(BaseModel):
    """Schema for generating a job draft"""

    title: str
    raw_requirements: str
    reference_jd: str | None = None


class JobDraftResponse(BaseModel):
    """Schema for the generated job draft response"""

    title: str
    description: str  # role_overview
    requiredSkillsAndExperience: list[str]
    niceToHave: list[str]
    benefits: list[str]
    about_company: str | None = None

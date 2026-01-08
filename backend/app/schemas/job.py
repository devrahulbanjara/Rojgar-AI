from typing import Any

from pydantic import BaseModel


class OrganizationResponseInJob(BaseModel):
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
    organization_id: str
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

    organization: OrganizationResponseInJob | None = None
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
    title: str
    department: str | None = None
    level: str | None = None

    description: str | None = ""
    requiredSkillsAndExperience: list[str] | None = []
    niceToHave: list[str] | None = None
    benefits: list[str] | None = None

    locationCity: str | None = None
    locationCountry: str | None = None
    locationType: str = "On-site"
    employmentType: str | None = None

    salaryMin: int | None = None
    salaryMax: int | None = None
    currency: str | None = "NPR"

    applicationDeadline: str | None = None

    status: str | None = "active"

    mode: str = "manual"
    raw_requirements: str | None = None


class JobUpdate(BaseModel):
    title: str | None = None
    department: str | None = None
    level: str | None = None

    description: str | None = None
    requiredSkillsAndExperience: list[str] | None = None
    niceToHave: list[str] | None = None
    benefits: list[str] | None = None

    locationCity: str | None = None
    locationCountry: str | None = None
    locationType: str | None = None
    employmentType: str | None = None

    salaryMin: int | None = None
    salaryMax: int | None = None
    currency: str | None = None

    applicationDeadline: str | None = None

    status: str | None = None


class JobDraftGenerateRequest(BaseModel):
    title: str
    raw_requirements: str
    reference_jd: str | None = None


class JobDraftResponse(BaseModel):
    title: str
    description: str
    requiredSkillsAndExperience: list[str]
    niceToHave: list[str]
    benefits: list[str]
    about_company: str | None = None

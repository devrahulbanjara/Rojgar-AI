from typing import Annotated, Any

from pydantic import BaseModel


class OrganizationResponseInJob(BaseModel):
    id: Annotated[str, "Organization ID"]
    name: Annotated[str, "Organization name"]
    description: Annotated[str | None, "Organization description"] = None
    location: Annotated[str | None, "Organization location"] = None
    website: Annotated[str | None, "Organization website URL"] = None
    industry: Annotated[str | None, "Industry domain"] = None
    founded_year: Annotated[int | None, "Year the organization was founded"] = None

    class Config:
        from_attributes = True


class JobResponse(BaseModel):
    job_id: Annotated[str, "Job ID"]
    id: Annotated[str, "Internal job identifier"]
    organization_id: Annotated[str, "Associated organization ID"]
    job_description_id: Annotated[str, "Job description ID"]

    title: Annotated[str, "Job title"]
    department: Annotated[str | None, "Department name"] = None
    level: Annotated[str | None, "Job level (e.g., junior, senior)"] = None

    location: Annotated[str | None, "General location"] = None
    location_city: Annotated[str | None, "City of the job"] = None
    location_country: Annotated[str | None, "Country of the job"] = None
    is_remote: Annotated[bool, "Whether the job is remote"] = False
    location_type: Annotated[str | None, "Location type (onsite/remote/hybrid)"] = None

    employment_type: Annotated[str | None, "Employment type"] = "Full-time"

    salary_min: Annotated[int | None, "Minimum salary"] = None
    salary_max: Annotated[int | None, "Maximum salary"] = None
    salary_currency: Annotated[str | None, "Salary currency"] = "USD"
    salary_range: Annotated[dict[str, Any] | None, "Salary range dictionary"] = None

    status: Annotated[str, "Job status"] = "active"
    posted_date: Annotated[str | None, "Job posted date"] = None
    application_deadline: Annotated[str | None, "Application deadline"] = None
    created_at: Annotated[str | None, "Job creation timestamp"] = None
    updated_at: Annotated[str | None, "Job last update timestamp"] = None

    organization: Annotated[
        OrganizationResponseInJob | None, "Organization details"
    ] = None
    company_name: Annotated[str | None, "Company name"] = None

    description: Annotated[str | None, "Job description"] = None
    role_overview: Annotated[str | None, "Role overview"] = None

    skills: Annotated[list[str], "Skills list"] = []
    required_skills: Annotated[dict[str, Any] | None, "Required skills details"] = None

    requirements: Annotated[list[str], "Job requirements"] = []
    benefits: Annotated[list[str], "Job benefits"] = []
    nice_to_have: Annotated[list[str], "Nice-to-have skills"] = []
    applicant_count: Annotated[int, "Number of applicants"] = 0
    views_count: Annotated[int, "Number of views"] = 0
    is_featured: Annotated[bool, "Whether the job is featured"] = False

    class Config:
        from_attributes = True
        populate_by_name = True


class JobListResponse(BaseModel):
    jobs: Annotated[list[JobResponse], "List of jobs"]
    total: Annotated[int, "Total number of jobs"]
    page: Annotated[int, "Current page number"]
    limit: Annotated[int, "Number of items per page"]
    total_pages: Annotated[int, "Total pages"]
    has_next: Annotated[bool, "Is there a next page?"]
    has_prev: Annotated[bool, "Is there a previous page?"]


class JobCreate(BaseModel):
    title: Annotated[str, "Job title"]
    department: Annotated[str | None, "Department name"] = None
    level: Annotated[str | None, "Job level"] = None

    description: Annotated[str | None, "Job description"] = ""
    requiredSkillsAndExperience: Annotated[
        list[str] | None, "Required skills and experience"
    ] = []
    niceToHave: Annotated[list[str] | None, "Nice-to-have skills"] = None
    benefits: Annotated[list[str] | None, "Job benefits"] = None

    locationCity: Annotated[str | None, "Job city"] = None
    locationCountry: Annotated[str | None, "Job country"] = None
    locationType: Annotated[str, "Location type"] = "On-site"
    employmentType: Annotated[str | None, "Employment type"] = None

    salaryMin: Annotated[int | None, "Minimum salary"] = None
    salaryMax: Annotated[int | None, "Maximum salary"] = None
    currency: Annotated[str | None, "Salary currency"] = "NPR"

    applicationDeadline: Annotated[str | None, "Application deadline"] = None

    status: Annotated[str | None, "Job status"] = "active"

    mode: Annotated[str, "Creation mode"] = "manual"
    raw_requirements: Annotated[str | None, "Raw requirements text"] = None


class JobUpdate(BaseModel):
    title: Annotated[str | None, "Job title"] = None
    department: Annotated[str | None, "Department name"] = None
    level: Annotated[str | None, "Job level"] = None

    description: Annotated[str | None, "Job description"] = None
    requiredSkillsAndExperience: Annotated[
        list[str] | None, "Required skills and experience"
    ] = None
    niceToHave: Annotated[list[str] | None, "Nice-to-have skills"] = None
    benefits: Annotated[list[str] | None, "Job benefits"] = None

    locationCity: Annotated[str | None, "Job city"] = None
    locationCountry: Annotated[str | None, "Job country"] = None
    locationType: Annotated[str | None, "Location type"] = None
    employmentType: Annotated[str | None, "Employment type"] = None

    salaryMin: Annotated[int | None, "Minimum salary"] = None
    salaryMax: Annotated[int | None, "Maximum salary"] = None
    currency: Annotated[str | None, "Salary currency"] = None

    applicationDeadline: Annotated[str | None, "Application deadline"] = None

    status: Annotated[str | None, "Job status"] = None


class JobDraftGenerateRequest(BaseModel):
    title: Annotated[str, "Job title"]
    raw_requirements: Annotated[str, "Raw requirements text"]
    reference_jd: Annotated[str | None, "Reference job description"] = None


class JobDraftResponse(BaseModel):
    title: Annotated[str, "Job title"]
    description: Annotated[str, "About the role"]
    requiredSkillsAndExperience: Annotated[list[str], "Required skills and experience"]
    niceToHave: Annotated[list[str], "Nice-to-have skills"]
    benefits: Annotated[list[str], "Job benefits"]
    about_company: Annotated[str | None, "About the company"] = None


class CreateReferenceJD(BaseModel):
    role_overview: Annotated[str, "About the role"]
    requiredSkillsAndExperience: Annotated[list[str], "Required skills and experience"]
    niceToHave: Annotated[list[str], "Nice-to-have skills"]
    benefits: Annotated[list[str], "Job benefits"]
    department: Annotated[
        str | None, "Department in the company in which the JD belongs to"
    ] = None


class ReferenceJDResponse(CreateReferenceJD):
    id: Annotated[str, "Reference JD ID"]
    about_the_company: Annotated[str | None, "About the company"] = None


class ReferenceJDListResponse(BaseModel):
    reference_jds: Annotated[list[ReferenceJDResponse], "List of reference JDs"]

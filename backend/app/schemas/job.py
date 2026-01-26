from datetime import date, datetime
from typing import Annotated, Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.agents.jd_generator import JobDescription


class TimestampMixin(BaseModel):
    created_at: Annotated[datetime, Field(description="Creation timestamp")]
    updated_at: Annotated[datetime, Field(description="Last update timestamp")]


class PaginationMixin(BaseModel):
    total: Annotated[int, "Total number of items"]
    page: Annotated[int, "Current page number"]
    limit: Annotated[int, "Number of items per page"]
    total_pages: Annotated[int, "Total pages"]
    has_next: Annotated[bool, "Is there a next page?"]
    has_prev: Annotated[bool, "Is there a previous page?"]


class LocationBase(BaseModel):
    location_city: Annotated[str | None, "City"] = None
    location_country: Annotated[str | None, "Country"] = None
    is_remote: Annotated[bool, "Whether the job is remote"] = False
    location_type: Annotated[str | None, "Location type (onsite/remote/hybrid)"] = None


class SalaryBase(BaseModel):
    salary_min: Annotated[int | None, "Minimum salary"] = None
    salary_max: Annotated[int | None, "Maximum salary"] = None
    salary_currency: Annotated[str | None, "Salary currency"] = "NPR"
    salary_range: Annotated[dict[str, Any] | None, "Salary range dictionary"] = None


class JobMetadataBase(BaseModel):
    title: Annotated[str, "Job title"]
    department: Annotated[str | None, "Department name"] = None
    level: Annotated[str | None, "Job level (e.g., junior, senior)"] = None
    employment_type: Annotated[str | None, "Employment type"] = "Full-time"
    status: Annotated[str, "Job status"] = "active"


class JobDatesBase(BaseModel):
    posted_date: Annotated[date | None, "Job posted date"] = None
    application_deadline: Annotated[date | None, "Application deadline"] = None


class JobContentBase(BaseModel):
    job_summary: Annotated[str, "Job summary"]
    job_responsibilities: Annotated[list[str], "Job responsibilities"]
    required_qualifications: Annotated[list[str], "Required qualifications"]
    preferred: Annotated[list[str], "Preferred skills"]
    compensation_and_benefits: Annotated[list[str], "Compensation and benefits"]


class OrganizationBase(BaseModel):
    id: Annotated[UUID, Field(description="Organization ID")]
    name: Annotated[str, "Organization name"]
    description: Annotated[str | None, "Organization description"] = None
    location_city: Annotated[str | None, "Organization location city"] = None
    location_country: Annotated[str | None, "Organization location country"] = None
    website: Annotated[str | None, "Organization website URL"] = None
    industry: Annotated[str | None, "Industry domain"] = None
    founded_year: Annotated[int | None, "Year the organization was founded"] = None


class OrganizationResponseInJob(OrganizationBase):
    model_config = ConfigDict(from_attributes=True)


class JobCore(BaseModel):
    job_id: UUID
    id: UUID
    organization_id: UUID
    job_description_id: UUID


class JobResponse(
    JobCore,
    JobMetadataBase,
    LocationBase,
    SalaryBase,
    JobDatesBase,
    JobContentBase,
    TimestampMixin,
):
    organization: Annotated[
        OrganizationResponseInJob | None, "Organization details"
    ] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class JobListResponse(PaginationMixin):
    jobs: Annotated[list[JobResponse], "List of jobs"]


class JobCreateUpdateBase(JobDescription):
    title: Annotated[str, "Job title"]
    department: Annotated[str | None, "Department name"] = None
    level: Annotated[str | None, "Job level"] = None
    location_city: Annotated[str | None, "Job city"] = None
    location_country: Annotated[str | None, "Job country"] = None
    location_type: Annotated[str, "Location type"] = "On-site"
    employment_type: Annotated[str | None, "Employment type"] = None
    salary_min: Annotated[int | None, "Minimum salary"] = None
    salary_max: Annotated[int | None, "Maximum salary"] = None
    salary_currency: Annotated[str | None, "Salary currency"] = "NPR"
    application_deadline: Annotated[str | None, "Application deadline"] = None
    status: Annotated[str | None, "Job status"] = "active"


class JobCreate(JobCreateUpdateBase):
    mode: Annotated[str, "Creation mode"] = "manual"
    raw_requirements: Annotated[str | None, "Raw requirements text"] = None
    is_aigenerated: Annotated[bool | None, "Whether the job is AI generated"] = None


class JobUpdate(JobCreateUpdateBase):
    title: Annotated[str | None, "Job title"] = None
    locationType: Annotated[str | None, "Location type"] = None
    currency: Annotated[str | None, "Salary currency"] = None
    job_summary: Annotated[str | None, "Job summary"] = None
    job_responsibilities: Annotated[list[str] | None, "Job responsibilities"] = None
    required_qualifications: Annotated[list[str] | None, "Required qualifications"] = (
        None
    )
    preferred: Annotated[list[str] | None, "Preferred skills"] = None
    compensation_and_benefits: Annotated[
        list[str] | None, "Compensation and benefits"
    ] = None


class JobDraftGenerateRequest(BaseModel):
    title: Annotated[str, "Job title"]
    raw_requirements: Annotated[str, "Raw requirements text"]
    reference_jd_id: Annotated[UUID | None, "Reference job description ID"] = None
    current_draft: Annotated[dict[str, Any] | None, "Current draft state"] = None


class JobDraftResponse(JobDescription):
    pass


class ReferenceJDBase(JobDescription):
    department: Annotated[
        str | None, "Department in the company in which the JD belongs to"
    ] = None


class CreateReferenceJD(ReferenceJDBase):
    pass


class ReferenceJDResponse(ReferenceJDBase):
    model_config = ConfigDict(from_attributes=True)

    id: Annotated[UUID, Field(validation_alias="referncejd_id")]
    organization_id: UUID
    about_the_company: Annotated[str | None, "About the company"] = None


class ReferenceJDListResponse(PaginationMixin):
    reference_jds: Annotated[list[ReferenceJDResponse], "List of reference JDs"]

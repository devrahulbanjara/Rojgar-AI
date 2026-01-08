from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict

from app.models import ApplicationStatus


class JobSummary(BaseModel):
    job_id: Annotated[str, "Job ID"]
    title: Annotated[str, "Job title"]
    location_city: Annotated[str | None, "City of the job"] = None
    employment_type: Annotated[
        str | None, "Employment type (full-time, part-time, etc.)"
    ] = None

    model_config = ConfigDict(from_attributes=True)


class OrganizationSummary(BaseModel):
    organization_id: Annotated[str, "Organization ID"]
    organization_name: Annotated[str, "Organization name"]
    organization_logo: Annotated[str | None, "URL of organization logo"] = None

    model_config = ConfigDict(from_attributes=True)


class ApplicationResponse(BaseModel):
    application_id: Annotated[str, "Application ID"]
    current_status: Annotated[ApplicationStatus, "Current application status"]
    applied_at: Annotated[datetime, "Application submission timestamp"]
    updated_at: Annotated[datetime, "Last update timestamp"]

    # Nested objects
    job: Annotated[JobSummary, "Job details"]
    organization: Annotated[OrganizationSummary, "Organization details"]

    model_config = ConfigDict(from_attributes=True)

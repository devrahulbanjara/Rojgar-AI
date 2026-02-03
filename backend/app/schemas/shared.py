from datetime import date
from enum import Enum
from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, Field


class ErrorCode(str, Enum):
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS"
    RESOURCE_CONFLICT = "RESOURCE_CONFLICT"
    BUSINESS_LOGIC_ERROR = "BUSINESS_LOGIC_ERROR"
    INVALID_OPERATION = "INVALID_OPERATION"
    JOB_NOT_FOUND = "JOB_NOT_FOUND"
    CANDIDATE_NOT_FOUND = "CANDIDATE_NOT_FOUND"
    APPLICATION_NOT_FOUND = "APPLICATION_NOT_FOUND"
    ORGANIZATION_NOT_FOUND = "ORGANIZATION_NOT_FOUND"
    USER_NOT_FOUND = "USER_NOT_FOUND"
    RESUME_NOT_FOUND = "RESUME_NOT_FOUND"
    WEBHOOK_PROCESSING_FAILED = "WEBHOOK_PROCESSING_FAILED"


class ErrorResponse(BaseModel):
    detail: str = Field(description="Human-readable error message")
    error_code: str | None = Field(
        default=None, description="Machine-readable error code for frontend translation"
    )
    details: dict[str, Any] | None = Field(
        default=None,
        description="Additional error context (only in development or when explicitly provided)",
    )
    request_id: str | None = Field(
        default=None, description="Unique request identifier for tracing"
    )
    timestamp: str | None = Field(
        default=None, description="ISO timestamp when the error occurred"
    )
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "detail": "The requested resource was not found",
                "error_code": "RESOURCE_NOT_FOUND",
                "details": {
                    "resource_id": "12345",
                    "resource_type": "job",
                },
                "request_id": "req_7f8a9b2c",
                "timestamp": "2025-02-03T14:22:30",
            }
        }
    )


class SocialLinkBase(BaseModel):
    type: Annotated[str, "Type of social platform"]
    url: Annotated[str, "Social profile URL"]


class WorkExperienceBase(BaseModel):
    job_title: Annotated[str, "Job title"]
    company: Annotated[str, "Company name"]
    location: Annotated[str | None, "Job location"] = None
    start_date: Annotated[date | None, "Employment start date"] = None
    end_date: Annotated[date | None, "Employment end date"] = None
    is_current: Annotated[bool, "Whether this is the current role"] = False
    description: Annotated[str | None, "Role description"] = None


class EducationBase(BaseModel):
    college_name: Annotated[str, "College or university name"]
    degree: Annotated[str, "Degree or program name"]
    location: Annotated[str | None, "Education location"] = None
    start_date: Annotated[date | None, "Education start date"] = None
    end_date: Annotated[date | None, "Education end date"] = None
    is_current: Annotated[bool, "Whether this education is ongoing"] = False


class CertificationBase(BaseModel):
    certification_name: Annotated[str, "Certification name"]
    issuing_body: Annotated[str, "Issuing organization"]
    credential_id: Annotated[str | None, "Credential ID"] = None
    credential_url: Annotated[str | None, "Credential verification URL"] = None
    issue_date: Annotated[date | None, "Certification issue date"] = None
    expiration_date: Annotated[date | None, "Certification expiration date"] = None
    does_not_expire: Annotated[bool, "Whether the certification does not expire"] = (
        False
    )


class SkillBase(BaseModel):
    skill_name: Annotated[str, "Skill name"]

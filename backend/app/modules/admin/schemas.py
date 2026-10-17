from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import Field

from app.core.schemas import BaseSchema
from app.modules.auth.enums import BusinessStatus

ReportReason = Literal["fee_requested", "fake", "discriminatory", "other"]


class ApprovalItem(BaseSchema):
    id: UUID
    name: str
    business_type: str | None = None
    district: str | None = None
    phone: str | None = None
    pan_number: str | None = None
    # Short-lived link to the private certificate file.
    document_url: str | None = None
    document_is_pdf: bool = False
    created_by_name: str | None = None
    created_by_contact: str | None = None
    # Set after "Ask for more info"; the business is still pending.
    info_requested: str | None = None
    created_at: datetime


class BusinessRow(BaseSchema):
    id: UUID
    name: str
    slug: str
    business_type: str | None = None
    district: str | None = None
    status: BusinessStatus
    status_reason: str | None = None
    plan: str
    members: int
    jobs: int
    open_reports: int
    created_at: datetime


class MessageRequest(BaseSchema):
    message: str = Field(min_length=3, max_length=500)


class ReasonRequest(BaseSchema):
    reason: str = Field(min_length=3, max_length=500)


class OptionalReasonRequest(BaseSchema):
    reason: str | None = Field(default=None, max_length=500)


class ReportCreate(BaseSchema):
    reason: ReportReason
    details: str | None = Field(default=None, max_length=1000)


class ReportItem(BaseSchema):
    id: UUID
    source: Literal["applicant", "auto"]
    reason: ReportReason
    details: str | None = None
    created_at: datetime


class FlaggedJob(BaseSchema):
    job_id: UUID
    job_title: str
    job_slug: str
    business_id: UUID
    business_name: str
    business_status: BusinessStatus
    unpublished: bool
    reports: list[ReportItem]
    latest_at: datetime


class PaymentRow(BaseSchema):
    id: UUID
    business_id: UUID
    business_name: str
    item: str
    amount_npr: int
    reference: str | None = None
    status: Literal["awaiting", "received"]
    created_at: datetime
    received_at: datetime | None = None


class MarkReceivedRequest(BaseSchema):
    reference: str | None = Field(default=None, max_length=100)

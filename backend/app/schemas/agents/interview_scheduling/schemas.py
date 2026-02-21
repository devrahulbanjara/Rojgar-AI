from typing import Literal, TypedDict


class InterviewSchedulingState(TypedDict):
    application_id: str
    name: str
    email: str
    org_name: str
    status: Literal["shortlisted", "rejected"]
    score: int
    feedback: str
    subject: str | None
    draft_email_html: str | None
    approved: bool
    auto_approved: bool
    send_status: str | None
    retry_count: int

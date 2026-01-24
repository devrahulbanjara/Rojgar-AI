from typing import TypedDict


class InterviewSchedulingState(TypedDict):
    name: str
    email: str
    reason: str
    draft_email: str | None
    approved: bool
    auto_approved: bool
    send_status: str | None

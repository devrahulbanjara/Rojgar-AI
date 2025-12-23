"""
Schemas for the interview scheduling workflow.
"""

from typing import TypedDict, Optional


class InterviewSchedulingState(TypedDict):
    """
    State schema for the interview scheduling workflow.

    Tracks the lifecycle of sending interview scheduling emails
    from draft composition through human approval to sending.
    """

    name: str
    """Candidate's name."""

    email: str
    """Candidate's email address."""

    reason: str
    """Reason for shortlisting the candidate."""

    draft_email: Optional[str]
    """HTML email content draft."""

    approved: bool
    """Whether the email has been approved for sending."""

    auto_approved: bool
    """If True, skips human approval gate."""

    send_status: Optional[str]
    """Status of email sending: 'success', 'failed: <reason>', or None."""


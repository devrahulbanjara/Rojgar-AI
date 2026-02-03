from app.integrations.google.gmail_client import send_interview_email
from app.schemas.agents.interview_scheduling import InterviewSchedulingState

from .graph import create_workflow
from .nodes import (
    approval_router,
    compose_email_draft,
    human_approval_gate,
    load_state,
    send_email,
    wrap_up,
)
from .templates import get_interview_email_template

app = create_workflow()
__all__ = [
    "InterviewSchedulingState",
    "get_interview_email_template",
    "send_interview_email",
    "create_workflow",
    "app",
    "load_state",
    "compose_email_draft",
    "human_approval_gate",
    "approval_router",
    "send_email",
    "wrap_up",
]

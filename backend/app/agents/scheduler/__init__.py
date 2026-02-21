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
from .templates import get_email_html_layout

app = create_workflow()
__all__ = [
    "InterviewSchedulingState",
    "app",
    "approval_router",
    "compose_email_draft",
    "create_workflow",
    "get_email_html_layout",
    "human_approval_gate",
    "load_state",
    "send_email",
    "send_interview_email",
    "wrap_up",
]

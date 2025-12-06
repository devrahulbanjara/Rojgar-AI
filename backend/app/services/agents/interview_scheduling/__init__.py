# Schema
from app.models.agents.interview_scheduling import InterviewSchedulingState

# Email service
from .email_service import send_interview_email

# Workflow
from .graph import create_workflow

# Node functions (for advanced usage)
from .nodes import (
    approval_router,
    compose_email_draft,
    human_approval_gate,
    load_state,
    send_email,
    wrap_up,
)

# Email template
from .templates import get_interview_email_template

# Create the compiled workflow app
app = create_workflow()

__all__ = [
    # Schema
    "InterviewSchedulingState",
    # Template
    "get_interview_email_template",
    # Service
    "send_interview_email",
    # Workflow
    "create_workflow",
    "app",
    # Nodes
    "load_state",
    "compose_email_draft",
    "human_approval_gate",
    "approval_router",
    "send_email",
    "wrap_up",
]

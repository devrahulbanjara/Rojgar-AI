import os

from app.core import settings
from app.models.agents.interview_scheduling import InterviewSchedulingState

from .email_service import send_interview_email
from .graph import create_workflow
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

os.environ.setdefault(
    "LANGCHAIN_TRACING_V2", str(settings.LANGCHAIN_TRACING_V2).lower()
)
os.environ.setdefault("LANGCHAIN_API_KEY", settings.LANGCHAIN_API_KEY)
os.environ.setdefault("LANGCHAIN_ENDPOINT", settings.LANGCHAIN_ENDPOINT)
os.environ.setdefault("LANGCHAIN_PROJECT", settings.LANGCHAIN_PROJECT)

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

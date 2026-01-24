import os

from langgraph.checkpoint.memory import InMemorySaver

from app.core import settings

from .graph import create_workflow
from .jds import reference_jd
from .llm_service import get_llm, structured_llm
from .nodes import generator_node, human_node, router

os.environ.setdefault(
    "LANGCHAIN_TRACING_V2", str(settings.LANGCHAIN_TRACING_V2).lower()
)
os.environ.setdefault("LANGCHAIN_API_KEY", settings.LANGCHAIN_API_KEY)
os.environ.setdefault("LANGCHAIN_ENDPOINT", settings.LANGCHAIN_ENDPOINT)
os.environ.setdefault("LANGCHAIN_PROJECT", settings.LANGCHAIN_PROJECT)

checkpointer = InMemorySaver()

builder = create_workflow()
app = builder.compile(checkpointer=checkpointer)


__all__ = [
    "create_workflow",
    "app",
    "get_llm",
    "structured_llm",
    "generator_node",
    "human_node",
    "router",
    "reference_jd",
]

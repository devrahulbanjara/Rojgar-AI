from langgraph.checkpoint.memory import InMemorySaver

from .graph import create_workflow
from .nodes import generator_node

checkpointer = InMemorySaver()
builder = create_workflow()
app = builder.compile(checkpointer=checkpointer)
__all__ = ["app", "create_workflow", "generator_node"]

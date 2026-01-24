from langchain_core.messages import HumanMessage, SystemMessage

from app.services.agents.jd_generator.prompts import SYSTEM_PROMPT, REVISION_USER_PROMPT, FIRST_GENERATION_USER_PROMPT
from app.schemas.agents.jd_generator import JobState
from app.core import settings
from app.core.ml import get_llm
from app.schemas.agents.jd_generator import JobDescription

def generator_node(state: JobState) -> dict:

    title = state["title"]
    short_requirements = state["requirements"]
    
    format_reference = state["format_reference"]
    feedback = state.get("feedback", "")
    is_revision = bool(feedback) and state.get("draft") is not None

    llm = get_llm(settings.THINK_LLM)
    structured_llm = llm.with_structured_output(JobDescription)

    if is_revision:
        current_draft = state["draft"].model_dump_json(indent=2)
        user_prompt = REVISION_USER_PROMPT.format(title=title, current_draft=current_draft, feedback=feedback)

    else:
        user_prompt = FIRST_GENERATION_USER_PROMPT.format(title=title, requirements=short_requirements, format_reference=format_reference)

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=user_prompt),
    ]

    response_obj = structured_llm.invoke(messages)

    return {
        "draft": response_obj,
        "revision_count": state.get("revision_count", 0) + 1,
    }

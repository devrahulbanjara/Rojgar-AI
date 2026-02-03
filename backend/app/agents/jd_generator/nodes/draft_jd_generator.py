from langchain_core.messages import HumanMessage, SystemMessage

from app.agents.jd_generator.prompts import (
    FIRST_GENERATION_USER_PROMPT,
    REVISION_USER_PROMPT,
    SYSTEM_PROMPT,
)
from app.core import settings
from app.integrations.llm.provider import get_llm
from app.schemas.agents.jd_generator import JobDescription, JobState


def generator_node(state: JobState) -> dict:
    title = state["title"]
    short_requirements = state["raw_requirements"]
    reference_jd = state["reference_jd"]
    feedback = state.get("feedback", "")
    is_revision = bool(feedback) and state.get("draft") is not None
    llm = get_llm(settings.THINK_LLM)
    structured_llm = llm.with_structured_output(JobDescription)
    if is_revision:
        current_draft = state["draft"].model_dump_json(indent=2)
        user_prompt = REVISION_USER_PROMPT.format(
            title=title, current_draft=current_draft, feedback=feedback
        )
    else:
        user_prompt = FIRST_GENERATION_USER_PROMPT.format(
            title=title, raw_requirements=short_requirements, reference_jd=reference_jd
        )
    messages = [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=user_prompt)]
    response_obj = structured_llm.invoke(messages)
    return {"draft": response_obj, "revision_count": state.get("revision_count", 0) + 1}

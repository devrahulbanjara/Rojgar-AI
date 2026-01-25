from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage

from app.core.config import settings
from app.core.logging_config import logger
from app.core.model_provider import get_llm
from app.schemas.agents.shortlist.schemas import (
    AgentState,
    HREvaluation,
    ResearchFindings,
)
from app.services.agents.shortlist.prompts import (
    HR_EVALUATION_EVAL_PROMPT,
    HR_EVALUATION_SYSTEM_PROMPT,
)
from app.services.agents.shortlist.retry import invoke_with_retry
from app.services.agents.shortlist.search_tool import search_tool


def hr_evaluation_node(state: AgentState) -> dict:
    logger.info(f"HR EVALUATION — ITERATION {state.get('iteration', 0) + 1} ")

    jd_req = state["jd_requirements"]
    history = state.get("hr_messages", [])

    model_with_tools = get_llm(settings.THINK_LLM).bind_tools([search_tool])

    if not history:
        critique_context = ""
        if state.get("critique") and state["critique"].hr_gaps:
            critique_context = f"""
            \n\nCRITIQUE FEEDBACK:\n{", ".join(state["critique"].hr_gaps)}\nAddress these gaps with research.
            """

        system_prompt = HR_EVALUATION_SYSTEM_PROMPT.format(
            jd_req=jd_req,
            profile=state["profile"],
            critique_context=critique_context.strip(),
        )

        history = [SystemMessage(content=system_prompt)]

    response = invoke_with_retry(model_with_tools, history)

    if response.tool_calls:
        tool_call = response.tool_calls[0]
        logger.info(f"Doing web search: {tool_call['args']['query']}")

        tool_response = search_tool.run(tool_call["args"])

        return {
            "hr_messages": history
            + [
                response,
                ToolMessage(content=tool_response, tool_call_id=tool_call["id"]),
            ]
        }

    eval_llm = get_llm(settings.THINK_LLM).with_structured_output(HREvaluation)

    eval_prompt = HR_EVALUATION_EVAL_PROMPT

    try:
        final_eval = invoke_with_retry(
            eval_llm, history + [response, HumanMessage(content=eval_prompt)]
        )
    except Exception as e:
        logger.error(f"Structured output failed, retrying: {str(e)[:100]}")

        final_eval = HREvaluation(
            culture_fit_score=5.0,
            career_trajectory="Unable to complete full evaluation",
            research_findings=ResearchFindings(findings=[], confidence_score=0.5),
            reasoning="Evaluation encountered technical issues",
        )

    return {"hr_eval": final_eval, "hr_messages": [], "hr_done": True}

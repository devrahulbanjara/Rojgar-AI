from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage

from app.core.config import settings
from app.core.logging_config import logger
from app.core.model_provider import get_llm
from app.schemas.agents.shortlist.schemas import (
    AgentState,
    TechnicalEvaluation,
)
from app.services.agents.shortlist.prompts import (
    TECHNICAL_EVALUATION_EVAL_PROMPT,
    TECHNICAL_EVALUATION_SYSTEM_PROMPT,
)
from app.services.agents.shortlist.retry import invoke_with_retry
from app.services.agents.shortlist.search_tool import search_tool


def technical_evaluation_node(state: AgentState) -> dict:
    logger.info(f"TECHNICAL EVALUATION — ITERATION {state.get('iteration', 0) + 1} ")

    jd_req = state["jd_requirements"]
    history = state.get("tech_messages", [])

    model_with_tools = get_llm(settings.THINK_LLM).bind_tools([search_tool])

    # for first iteration only, since we do not have any critique so far
    if not history:
        critique_context = ""

        if state.get("critique") and state["critique"].technical_gaps:
            critique_context = f"""
            \n\nCRITIQUE FEEDBACK:\n{", ".join(state["critique"].technical_gaps)}\n
            Address these gaps with additional research.
            """

        system_prompt = TECHNICAL_EVALUATION_SYSTEM_PROMPT.format(
            jd_req=jd_req,
            profile=state["profile"],
            critique_context=critique_context.strip(),
        )

        history = [SystemMessage(content=system_prompt)]

    response = invoke_with_retry(model_with_tools, history)
    logger.success("Kei ta xa hai" if response.content else "Key xaina yr")

    if response.tool_calls:
        tool_call = response.tool_calls[0]
        logger.info(f"Doing web search: {tool_call['args']['query']}")

        # Execute the Search
        tool_response = search_tool.run(tool_call["args"])

        logger.critical("kina vo ta")

        return {
            "tech_messages": history
            + [
                response,
                ToolMessage(content=tool_response, tool_call_id=tool_call["id"]),
            ]
        }

    eval_llm = get_llm(settings.THINK_LLM).with_structured_output(TechnicalEvaluation)

    eval_prompt = TECHNICAL_EVALUATION_EVAL_PROMPT

    try:
        final_eval = invoke_with_retry(
            eval_llm, history + [response, HumanMessage(content=eval_prompt)]
        )
    except Exception as e:
        logger.error(f"Structured output failed, retrying: {str(e)[:100]}")
        raise Exception(f"Structured output failed: {str(e)}")

    return {"tech_eval": final_eval, "tech_messages": [], "tech_done": True}

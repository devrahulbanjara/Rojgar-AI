from backend.app.services.agents.shortlist.prompts import CRITIQUE_SYSTEM_PROMPT
from langchain_core.messages import SystemMessage

from app.core.config import settings
from app.core.logging_config import logger
from app.core.model_provider import get_llm
from app.schemas.agents.shortlist.schemas import AgentState, CritiqueReport
from app.services.agents.shortlist.retry import invoke_with_retry


def critique_node(state: AgentState) -> dict:
    logger.info("QUALITY CRITIQUE & REVIEW")

    critique_llm = get_llm(settings.THINK_LLM).with_structured_output(CritiqueReport)

    prompt = CRITIQUE_SYSTEM_PROMPT.format(
        tech_eval=state["tech_eval"],
        hr_eval=state["hr_eval"],
        iteration=state.get("iteration", 0),
        max_iterations=state.get("max_iterations", 2),
    )

    critique = invoke_with_retry(critique_llm, [SystemMessage(content=prompt)])

    current_iteration = state.get("iteration", 0)
    max_iterations = state.get("max_iterations", 2)

    if critique.requires_rework and current_iteration < max_iterations:
        logger.critical(
            f"REWORK REQUIRED: {len(critique.recommendations)} recommendations"
        )

        for rec in critique.recommendations:
            print(f"    • {rec}")

        return {
            "critique": critique,
            "iteration": state.get("iteration", 0) + 1,
            "tech_done": False,
            "hr_done": False,
        }
    else:
        logger.success(
            f"Quality check passed (Confidence: {critique.confidence_level})"
        )
        return {"critique": critique}

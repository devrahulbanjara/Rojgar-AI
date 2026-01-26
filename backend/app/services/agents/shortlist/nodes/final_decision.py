from backend.app.services.agents.shortlist.prompts import FINAL_DECISION_SYSTEM_PROMPT
from langchain_core.messages import SystemMessage

from app.core.config import settings
from app.core.logging_config import logger
from app.core.model_provider import get_llm
from app.schemas.agents.shortlist.schemas import AgentState, FinalReport
from app.services.agents.shortlist.retry import invoke_with_retry


def final_decision_node(state: AgentState) -> dict:
    logger.info("FINAL HIRING DECISION")

    decision_llm = get_llm(settings.THINK_LLM).with_structured_output(FinalReport)

    jd_req = state["jd_requirements"]

    prompt = FINAL_DECISION_SYSTEM_PROMPT.format(
        jd_req=jd_req,
        tech_eval=state["tech_eval"],
        hr_eval=state["hr_eval"],
        critique=state["critique"],
    )

    final_report = invoke_with_retry(decision_llm, [SystemMessage(content=prompt)])

    logger.info(f"{'=' * 60}")
    logger.info(f"  DECISION: {final_report.decision}")
    logger.info(f"  FINAL SCORE: {final_report.final_score}/10")
    logger.info(
        f"  (Technical: {final_report.technical_score} | HR: {final_report.hr_score})"
    )
    logger.info(f"{'=' * 60}")

    return {"final_report": final_report}

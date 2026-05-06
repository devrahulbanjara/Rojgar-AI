from typing import cast

from loguru import logger

from app.agents.shortlisting.prompts import CRITIQUE_PROMPT
from app.agents.shortlisting.schemas import JudgeResponse, ShortlistState
from app.infrastructures.aws.bedrock import get_bedrock_llm


async def critique_node(state: ShortlistState) -> dict:
    """Review the latest CTO and HR evaluations and decide whether to stop."""
    judge_llm = get_bedrock_llm().with_structured_output(JudgeResponse)
    prompt = CRITIQUE_PROMPT.format(
        cto_eval=state["cto_evals"][-1].model_dump_json(),
        hr_eval=state["hr_evals"][-1].model_dump_json(),
    )
    response = cast(JudgeResponse, await judge_llm.ainvoke(prompt))
    name = state["applicant_name"]
    logger.info(
        "[{}] Critique said (iter={}, satisfied={}, conf={:.2f}): {}",
        name,
        state["iteration"] + 1,
        response.is_satisfied,
        response.confidence,
        response.critique,
    )
    return {
        "critiques": [response.critique],
        "is_satisfied": response.is_satisfied,
        "confidence": response.confidence,
        "iteration": state["iteration"] + 1,
    }

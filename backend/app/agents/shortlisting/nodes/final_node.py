from typing import cast

from loguru import logger

from app.agents.shortlisting.prompts import FINAL_PROMPT
from app.agents.shortlisting.schemas import FinalResponse, ShortlistState
from app.infrastructures.aws.bedrock import get_bedrock_llm


async def final_node(state: ShortlistState) -> dict:
    """Merge the latest CTO and HR evaluations into the final recruiter result."""
    summary_llm = get_bedrock_llm().with_structured_output(FinalResponse)
    prompt = FINAL_PROMPT.format(
        job_title=state["job_title"],
        cto_eval=state["cto_evals"][-1].model_dump_json(),
        hr_eval=state["hr_evals"][-1].model_dump_json(),
    )
    response = cast(FinalResponse, await summary_llm.ainvoke(prompt))
    name = state["applicant_name"]
    logger.info(
        "[{}] Final said: strengths={} | weaknesses={}",
        name,
        response.strengths,
        response.weaknesses,
    )
    return {
        "final_strengths": response.strengths,
        "final_weaknesses": response.weaknesses,
    }

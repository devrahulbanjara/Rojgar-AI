from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import settings
from app.core.logging_config import logger
from app.core.model_provider import get_llm
from app.schemas.agents.shortlist.schemas import AgentState, JobRequirements
from app.services.agents.shortlist.prompts import JD_PARSER_SYSTEM_PROMPT


def parse_jd_node(state: AgentState) -> dict:
    logger.info("Parsing JD")

    jd_llm = get_llm(settings.FAST_LLM).with_structured_output(JobRequirements)

    system_prompt = JD_PARSER_SYSTEM_PROMPT

    try:
        jd_requirements = jd_llm.invoke(
            messages=[
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"Job Description:\n\n{state['jd_text']}"),
            ]
        )

        logger.info("Parsing JD successful.")

    except Exception as e:
        raise Exception(f"JD parsing failed: {e}")

    return {"jd_requirements": jd_requirements}

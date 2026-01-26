from datetime import datetime

from langchain_core.messages import HumanMessage, SystemMessage
from llama_parse import LlamaParse
from llm_guard.input_scanners import Anonymize
from llm_guard.vault import Vault

from app.core.config import settings
from app.core.logging_config import logger
from app.core.model_provider import get_llm
from app.schemas.agents.shortlist.schemas import AgentState, ResumeProfile
from app.services.agents.shortlist.prompts import RESUME_PARSER_SYSTEM_PROMPT


def parse_resume_node(state: AgentState) -> dict:
    if state.get("profile"):
        logger.info("REWORK – RESETTING EVALUATION FLAGS")
        return {"tech_done": False, "hr_done": False}

    logger.info("PARSING RESUME")

    parser = LlamaParse(api_key=settings.LLAMA_PARSE_KEY, result_type="markdown")
    docs = parser.load_data(state["resume_path"])
    full_text = "\n".join([d.text for d in docs])
    logger.success("Resume parsing into markdown successful.")

    logger.info("REDACTING PII ")

    vault = Vault()
    scanner = Anonymize(
        vault, entity_types=["PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER", "URL"]
    )
    clean_text, _, _ = scanner.scan(full_text)

    logger.info("PII redaction successful.")

    today = datetime.now().strftime("%B %Y")

    profile_llm = get_llm(settings.FAST_LLM).with_structured_output(ResumeProfile)

    system_prompt = RESUME_PARSER_SYSTEM_PROMPT.format(today=today)

    user_prompt = f"""
    # Candidate's Resume \n
    {clean_text}
    """

    try:
        profile = profile_llm.invoke(
            messages=[
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
            ]
        )

        logger.info("Resume parsing successful.")

    except Exception as e:
        raise Exception(f"Resume parsing failed: {e}")

    return {
        "anonymized_text": clean_text,
        "profile": profile,
        "tech_done": False,
        "hr_done": False,
        "iteration": 0,
    }

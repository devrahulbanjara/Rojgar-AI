import re
from typing import Any, cast

from langchain.agents import create_agent
from langchain.agents.middleware import PIIMiddleware
from langchain_aws.middleware.prompt_caching import BedrockPromptCachingMiddleware
from langchain_core.messages import HumanMessage
from loguru import logger

from app.agents.shortlisting.prompts import CTO_PROMPT, SHARED_BIAS_POLICY
from app.agents.shortlisting.schemas import PersonaEvaluation, ShortlistState
from app.agents.shortlisting.tools import make_web_search_tool
from app.core.config import settings
from app.infrastructures.aws.bedrock import get_bedrock_llm
from app.infrastructures.guardrails import guardrails_service


def _safety_blocked_evaluation() -> PersonaEvaluation:
    """Stand-in evaluation returned when the prompt-injection rail blocks the resume."""
    return PersonaEvaluation(
        strengths=[],
        concerns=[
            "Resume rejected by safety policy: prompt-injection pattern detected."
        ],
        evidence=["Input rail blocked the resume content before evaluation."],
    )


async def cto_node(state: ShortlistState) -> dict:
    """Run the CTO evaluator agent for technical fit and engineering depth."""
    last_critique = (
        state["critiques"][-1] if state["critiques"] else "None (initial review)."
    )

    # Pre-flight prompt-injection check on the candidate-controlled resume.
    # Skip the agent call entirely if blocked so a malicious resume cannot
    # hijack the CTO evaluator.
    verdict = await guardrails_service.check_input(
        state["resume"], source="shortlisting.cto"
    )
    if not verdict.safe:
        logger.warning(
            "[{}] CTO node skipped — resume blocked by guardrails.",
            state["applicant_name"],
        )
        return {"cto_evals": [_safety_blocked_evaluation()]}

    prompt = CTO_PROMPT.format(
        bias_policy=SHARED_BIAS_POLICY,
        job_title=state["job_title"],
        jd=state["jd"],
        resume=state["resume"],
        last_critique=last_critique,
    )
    agent = create_agent(
        model=get_bedrock_llm(),
        tools=[make_web_search_tool("cto", state["applicant_name"])],
        response_format=PersonaEvaluation,
        system_prompt="CTO evaluator in a structured hiring workflow.",
        middleware=[
            # Defense-in-depth: redact any PII that may leak into the prompt
            PIIMiddleware("email", strategy="redact", apply_to_input=True),
            PIIMiddleware("url", strategy="redact", apply_to_input=True),
            PIIMiddleware(
                "phone_number",
                detector=re.compile(r"\+?\d{1,3}[\s.-]?\d{3,4}[\s.-]?\d{4}"),
                strategy="redact",
                apply_to_input=True,
            ),
            BedrockPromptCachingMiddleware(
                ttl=cast(Any, settings.shortlisting_prompt_cache_ttl),
                unsupported_model_behavior="ignore",
            ),
        ],
    )
    response = await agent.ainvoke(
        cast(Any, {"messages": [HumanMessage(content=prompt)]})
    )
    evaluation: PersonaEvaluation = response["structured_response"]
    name = state["applicant_name"]
    logger.info(
        "[{}] CTO said: strengths={} | concerns={} | evidence={}",
        name,
        evaluation.strengths,
        evaluation.concerns,
        evaluation.evidence,
    )
    return {"cto_evals": [evaluation]}

from typing import Any, cast

from langchain.agents import create_agent
from langchain.agents.middleware import PIIMiddleware
from langchain_aws.middleware.prompt_caching import BedrockPromptCachingMiddleware
from langchain_core.messages import HumanMessage
from loguru import logger

from app.agents.shortlisting.prompts import PERSONA_USER_PROMPT, SHARED_BIAS_POLICY
from app.agents.shortlisting.schemas import PersonaEvaluation, ShortlistState
from app.agents.shortlisting.tools import make_web_search_tool
from app.core.config import settings
from app.infrastructures.aws.bedrock import get_bedrock_llm


async def run_persona(
    *, role: str, system_template: str, state: ShortlistState, use_web_search: bool
) -> PersonaEvaluation:
    """Run one persona reviewer.

    The job-specific instructions live in the system prompt (identical for every
    candidate on the job, so Bedrock can cache them); the resume goes last.
    The resume is screened by the guardrail once, before the workflow starts.
    """
    last_critique = (
        state["critiques"][-1] if state["critiques"] else "None (initial review)."
    )
    system_prompt = system_template.format(
        bias_policy=SHARED_BIAS_POLICY,
        job_title=state["job_title"],
        jd=state["jd"],
    )
    user_prompt = PERSONA_USER_PROMPT.format(
        resume=state["resume"], last_critique=last_critique
    )
    tools = (
        [make_web_search_tool(role, state["application_ref"])] if use_web_search else []
    )
    agent = create_agent(
        model=get_bedrock_llm(),
        tools=tools,
        response_format=PersonaEvaluation,
        system_prompt=system_prompt,
        middleware=[
            # Defense-in-depth: the resume is already stripped of contact details.
            PIIMiddleware("email", strategy="redact", apply_to_input=True),
            PIIMiddleware("url", strategy="redact", apply_to_input=True),
            PIIMiddleware(
                "phone_number",
                detector=r"\+?\d{1,3}[\s.-]?\d{3,4}[\s.-]?\d{4}",
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
        cast(Any, {"messages": [HumanMessage(content=user_prompt)]})
    )
    evaluation: PersonaEvaluation = response["structured_response"]
    logger.info(
        "[app={}] {} review done: {} strengths, {} concerns",
        state["application_ref"],
        role,
        len(evaluation.strengths),
        len(evaluation.concerns),
    )
    return evaluation

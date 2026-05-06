from typing import Any, cast

from langchain.agents import create_agent
from langchain_aws.middleware.prompt_caching import BedrockPromptCachingMiddleware
from langchain_core.messages import HumanMessage
from loguru import logger

from app.agents.shortlisting.prompts import CTO_PROMPT, SHARED_BIAS_POLICY
from app.agents.shortlisting.schemas import PersonaEvaluation, ShortlistState
from app.agents.shortlisting.tools import make_web_search_tool
from app.core.config import settings
from app.infrastructures.aws.bedrock import get_bedrock_llm


async def cto_node(state: ShortlistState) -> dict:
    """Run the CTO evaluator agent for technical fit and engineering depth."""
    last_critique = (
        state["critiques"][-1] if state["critiques"] else "None (initial review)."
    )
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
            BedrockPromptCachingMiddleware(
                ttl=cast(Any, settings.shortlisting_prompt_cache_ttl),
                unsupported_model_behavior="ignore",
            )
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

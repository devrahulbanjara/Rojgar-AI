from langchain.agents import create_agent

from app.agents.shortlisting.prompts import HR_PROMPT
from app.agents.shortlisting.schemas import PersonaEvaluation, ShortlistState
from app.agents.shortlisting.tools import web_search
from app.infrastructures.aws.bedrock import get_bedrock_llm


async def hr_node(state: ShortlistState) -> dict:
    last_critique = (
        state["critiques"][-1] if state["critiques"] else "None (initial review)."
    )
    prompt = HR_PROMPT.format(
        job_title=state["job_title"],
        jd=state["jd"],
        resume=state["resume"],
        last_critique=last_critique,
    )
    agent = create_agent(
        model=get_bedrock_llm(),
        tools=[web_search],
        response_format=PersonaEvaluation,
        system_prompt="You are the HR evaluator in a structured hiring workflow.",
    )
    response = await agent.ainvoke({"messages": [("human", prompt)]})
    return {"hr_evals": [response["structured_response"]]}

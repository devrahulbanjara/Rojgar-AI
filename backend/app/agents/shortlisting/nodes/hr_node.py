from langchain.agents import create_agent
from langchain_aws import ChatBedrockConverse
from langchain_tavily import TavilySearch

from app.agents.shortlisting.prompts import HR_PROMPT
from app.core.config import settings
from app.schemas.agents.shortlist import PersonasResponse, ShortlistState

llm = ChatBedrockConverse(
    model_id="anthropic.claude-3-5-sonnet-20240620-v1:0",
    region_name="us-east-1",
    temperature=0,
)
websearch_tool = TavilySearch(max_results=3, tavily_api_key=settings.TAVILY_API_KEY)


def hr_node(state: ShortlistState):
    last_critique = (
        state["critiques"][-1] if state["critiques"] else "None (Initial Review)."
    )
    prompt = HR_PROMPT.format(
        jd=state["jd"], resume=state["resume"], last_critique=last_critique
    )
    agent = create_agent(
        model=llm, tools=[websearch_tool], response_format=PersonasResponse
    )
    response = agent.invoke({"messages": [("human", prompt)]})
    return {"hr_evals": [response["structured_response"]]}

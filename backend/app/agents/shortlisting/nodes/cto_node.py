from langchain.agents import create_agent

from app.agents.shortlisting.prompts import CTO_PROMPT
from app.integrations.aws.bedrock import get_bedrock_llm
from app.integrations.tavily.search import get_tavily_search
from app.schemas.agents.shortlist import PersonasResponse, ShortlistState

llm = get_bedrock_llm()
websearch_tool = get_tavily_search(max_results=3)


def cto_node(state: ShortlistState):
    last_critique = (
        state["critiques"][-1] if state["critiques"] else "None (Initial Review)."
    )
    prompt = CTO_PROMPT.format(
        jd=state["jd"], resume=state["resume"], last_critique=last_critique
    )
    agent = create_agent(
        model=llm, tools=[websearch_tool], response_format=PersonasResponse
    )
    response = agent.invoke({"messages": [("human", prompt)]})
    return {"cto_evals": [response["structured_response"]]}

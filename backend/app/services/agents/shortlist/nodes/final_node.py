from langchain_aws import ChatBedrockConverse

from app.schemas.agents.shortlist import FinalResponse, ShortlistState
from app.services.agents.shortlist.prompts import FINAL_PROMPT

llm = ChatBedrockConverse(
    model_id="anthropic.claude-3-5-sonnet-20240620-v1:0",
    region_name="us-east-1",
    temperature=0,
)


def final_node(state: ShortlistState):
    summary_llm = llm.with_structured_output(FinalResponse)

    prompt = FINAL_PROMPT.format(
        cto_eval=state["cto_evals"][-1], hr_eval=state["hr_evals"][-1]
    )

    res = summary_llm.invoke(prompt)
    return {"final_score": res.score, "final_reason": res.reason}

from langchain_aws import ChatBedrockConverse

from app.schemas.agents.shortlist import JudgeResponse, ShortlistState
from app.services.agents.shortlist.prompts import CRITIQUE_PROMPT

llm = ChatBedrockConverse(
    model_id="anthropic.claude-3-5-sonnet-20240620-v1:0",
    region_name="us-east-1",
    temperature=0,
)


def critique_node(state: ShortlistState):
    judge_llm = llm.with_structured_output(JudgeResponse)

    prompt = CRITIQUE_PROMPT.format(
        cto_eval=state["cto_evals"][-1], hr_eval=state["hr_evals"][-1]
    )

    res = judge_llm.invoke(prompt)
    return {
        "critiques": [res.critique],
        "is_satisfied": res.is_satisfied,
        "iteration": state["iteration"] + 1,
    }

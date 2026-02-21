from app.agents.shortlisting.prompts import FINAL_PROMPT
from app.integrations.aws.bedrock import get_bedrock_llm
from app.schemas.agents.shortlist import FinalResponse, ShortlistState

llm = get_bedrock_llm()


def final_node(state: ShortlistState):
    summary_llm = llm.with_structured_output(FinalResponse)
    prompt = FINAL_PROMPT.format(
        cto_eval=state["cto_evals"][-1], hr_eval=state["hr_evals"][-1]
    )
    res = summary_llm.invoke(prompt)
    return {"final_score": res.score, "final_reason": res.reason}

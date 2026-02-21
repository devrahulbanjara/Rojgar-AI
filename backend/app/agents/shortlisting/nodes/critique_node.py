from app.agents.shortlisting.prompts import CRITIQUE_PROMPT
from app.integrations.aws.bedrock import get_bedrock_llm
from app.schemas.agents.shortlist import JudgeResponse, ShortlistState

llm = get_bedrock_llm()


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

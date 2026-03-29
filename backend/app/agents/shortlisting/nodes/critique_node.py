from app.agents.shortlisting.prompts import CRITIQUE_PROMPT
from app.agents.shortlisting.schemas import JudgeResponse, ShortlistState
from app.infrastructures.aws.bedrock import get_bedrock_llm


async def critique_node(state: ShortlistState) -> dict:
    judge_llm = get_bedrock_llm().with_structured_output(JudgeResponse)
    prompt = CRITIQUE_PROMPT.format(
        cto_eval=state["cto_evals"][-1].model_dump_json(),
        hr_eval=state["hr_evals"][-1].model_dump_json(),
    )
    response = await judge_llm.ainvoke(prompt)
    return {
        "critiques": [response.critique],
        "is_satisfied": response.is_satisfied,
        "iteration": state["iteration"] + 1,
    }

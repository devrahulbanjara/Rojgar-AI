from app.agents.shortlisting.nodes._persona import run_persona
from app.agents.shortlisting.prompts import HR_SYSTEM_PROMPT
from app.agents.shortlisting.schemas import ShortlistState


async def hr_node(state: ShortlistState) -> dict:
    """Run the role-requirements reviewer against JD-derived competencies."""
    # No web search: this reviewer only compares the resume with the JD, and
    # searching candidate-supplied employer names invites indirect injection.
    evaluation = await run_persona(
        role="hr",
        system_template=HR_SYSTEM_PROMPT,
        state=state,
        use_web_search=False,
    )
    return {"hr_evals": [evaluation]}

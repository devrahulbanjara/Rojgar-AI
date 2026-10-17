from app.agents.shortlisting.nodes._persona import run_persona
from app.agents.shortlisting.prompts import CTO_SYSTEM_PROMPT
from app.agents.shortlisting.schemas import ShortlistState


async def cto_node(state: ShortlistState) -> dict:
    """Run the technical reviewer for engineering depth and delivery evidence."""
    evaluation = await run_persona(
        role="cto",
        system_template=CTO_SYSTEM_PROMPT,
        state=state,
        use_web_search=True,
    )
    return {"cto_evals": [evaluation]}

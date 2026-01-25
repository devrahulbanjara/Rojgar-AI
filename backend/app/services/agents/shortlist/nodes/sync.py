from app.core.logging_config import logger
from app.schemas.agents.shortlist.schemas import AgentState


def sync_node(state: AgentState) -> dict:
    if state.get("tech_done") and state.get("hr_done"):
        logger.info("Synced CTO and HR.")
    return {}

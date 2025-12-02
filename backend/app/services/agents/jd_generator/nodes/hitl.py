from app.models.agents.jd_generator import JobState


def human_node(state: JobState) -> dict:
    """Human review checkpoint - actual input handled via workflow interruption."""
    return {}

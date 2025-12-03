from app.models.agents.jd_generator import JobState
from langchain_core.messages import HumanMessage, SystemMessage
from ..llm_service import structured_llm


def generator_node(state: JobState) -> dict:
    """Generate or revise job description based on requirements and feedback."""

    reqs = state["requirements"]
    fmt = state["format_reference"]
    feedback = state.get("feedback")
    is_revision = feedback and state.get("draft")

    system_prompt = """
            You are an expert technical recruiter who writes compelling job descriptions.
            Your job descriptions are:
            - Honest and realistic (no buzzwords or marketing fluff)
            - Well-structured and scannable
            - Focused on what makes the role and company unique
            
            Output only valid JSON matching the schema. No markdown, no explanations.
            """

    if is_revision:
        current_draft = state["draft"].model_dump_json(indent=2)
        user_prompt = (
            f"Current Draft:\n{current_draft}\n\n"
            f"Revision Request:\n{feedback}\n\n"
            "Update relevant sections while preserving quality of unchanged parts."
        )
    else:
        user_prompt = (
            f"Requirements:\n{reqs}\n\n"
            f"Style Reference:\n{fmt}\n\n"
            "Create a complete job description matching the requirements and style reference."
        )

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]

    response_obj = structured_llm.invoke(messages)

    return {
        "draft": response_obj,
        "revision_count": state.get("revision_count", 0) + 1,
    }

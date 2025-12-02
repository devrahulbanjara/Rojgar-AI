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
        user_prompt = f"""## Current Draft
            {current_draft}
            
            ## Revision Request
            {feedback}
            
            ## Task
            Analyze the feedback and update the relevant sections while preserving the quality of unchanged parts.
            
            Think step-by-step:
            1. What specific changes does the feedback request?
            2. Which sections need to be updated?
            3. How can I maintain consistency across all sections?
            
            Now generate the revised job description."""
    else:
        user_prompt = f"""## Requirements
            {reqs}
            
            ## Style Reference
            Study this example for tone and structure:
            {fmt}
            
            ## Task
            Create a complete job description that:
            1. Matches the requirements exactly (role, experience, compensation)
            2. Follows the style and tone of the reference
            3. Includes specific, actionable details
            4. Is compelling to qualified candidates
            
            Generate the job description now."""

    messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)]

    try:
        response_obj = structured_llm.invoke(messages)
    except Exception as e:
        print(f"⚠️ Generation failed, retrying: {e}")
        messages.append(
            HumanMessage(
                content="Return ONLY valid JSON. No markdown formatting or additional text."
            )
        )
        response_obj = structured_llm.invoke(messages)

    return {"draft": response_obj, "revision_count": state.get("revision_count", 0) + 1}

from langsmith import traceable

from app.models.agents.jd_generator import JobState


@traceable(
    name="jd_finalizer_node",
    tags=["node:finalizer", "jd_generation"],
    metadata={"node_type": "finalizer", "purpose": "format_approved_draft"},
)
def finalizer_node(state: JobState) -> dict:
    """Convert approved draft to formatted markdown document."""
    draft = state["draft"]

    markdown = f"""# Job Description

        ## About Us
        {draft.about_the_company}

        ## Role Overview
        {draft.role_overview}

        ## Required Skills & Experience
        {chr(10).join(f"- {item}" for item in draft.required_skills_and_experience)}

        ## Nice to Have
        {chr(10).join(f"- {item}" for item in draft.nice_to_have)}

        ## What We Offer
        {chr(10).join(f"- {item}" for item in draft.what_company_offers)}

        ---
        *Approved after {state.get("revision_count", 0)} revision(s)*
        """

    return {"final_doc": markdown.strip()}

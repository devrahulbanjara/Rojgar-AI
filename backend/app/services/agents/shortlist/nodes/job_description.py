from typing import Any

from langsmith import traceable

from app.core import logger
from app.models.agents.shortlist import JobRequirements, WorkflowState

from ..llm_service import get_llm
from ..templates import JOB_DESCRIPTION_PARSER_PROMPT


@traceable(
    name="shortlist_parse_jd_node",
    tags=["node:parse_jd", "shortlist"],
    metadata={"node_type": "parse_jd", "purpose": "parse_job_description"},
)
def parse_job_description(state: WorkflowState) -> dict[str, Any]:
    logger.info("Parsing job description")
    jd_text = state.get("job_description_text", "")

    if not jd_text:
        raise ValueError("Job description text is required in workflow state")

    llm = get_llm()
    chain = JOB_DESCRIPTION_PARSER_PROMPT | llm.with_structured_output(JobRequirements)
    job_requirements = chain.invoke({"jd_text": jd_text})

    logger.success(
        f"Parsed job requirements: {len(job_requirements.required_skills)} skills"
    )
    return {"job_requirements": job_requirements, "job_description_text": jd_text}

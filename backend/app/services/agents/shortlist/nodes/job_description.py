from typing import Dict, Any
from loguru import logger
from ..llm_service import get_llm
from ..file_handler import read_job_description
from ..schemas import WorkflowState, JobRequirements
from ..templates import JOB_DESCRIPTION_PARSER_PROMPT


def parse_job_description(state: WorkflowState) -> Dict[str, Any]:
    logger.info("Parsing job description")
    jd_text = read_job_description()

    llm = get_llm()
    chain = JOB_DESCRIPTION_PARSER_PROMPT | llm.with_structured_output(JobRequirements)
    job_requirements = chain.invoke({"jd_text": jd_text})

    logger.success(
        f"Parsed job requirements: {len(job_requirements.required_skills)} skills"
    )
    return {"job_requirements": job_requirements, "job_description_text": jd_text}

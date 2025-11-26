import json
from typing import Dict, Any
from loguru import logger
from ..llm_service import get_llm
from ..schemas import WorkflowState, EvaluationScore
from ..templates import WORK_ALIGNMENT_PROMPT


def evaluate_work_alignment(state: WorkflowState) -> Dict[str, Any]:
    logger.info("Evaluating work experience alignment")
    job_desc = state["job_description_text"]

    llm = get_llm()
    chain = WORK_ALIGNMENT_PROMPT | llm.with_structured_output(EvaluationScore)

    evaluations = []

    for item in state["structured_resumes"]:
        resume = item["data"]
        result = chain.invoke(
            {
                "job_desc": job_desc,
                "work_exp": json.dumps(resume.work_experience, indent=2),
            }
        )

        evaluations.append(
            {
                "source_file": item["source_file"],
                "score": result.score,
                "justification": result.justification,
            }
        )

        logger.success(
            f"Work alignment evaluated for {item['source_file']}: {result.score}/10"
        )

    return {"work_alignment_evaluations": evaluations}

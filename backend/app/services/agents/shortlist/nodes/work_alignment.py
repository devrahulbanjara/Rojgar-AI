import json
from typing import Any

from langsmith import traceable

from app.core import logger
from app.models.agents.shortlist import EvaluationScore, WorkflowState

from ..llm_service import get_llm
from ..templates import WORK_ALIGNMENT_PROMPT


@traceable(
    name="shortlist_evaluate_work_alignment_node",
    tags=["node:evaluate_work_alignment", "shortlist"],
    metadata={
        "node_type": "evaluate_work_alignment",
        "purpose": "evaluate_work_experience_alignment",
    },
)
def evaluate_work_alignment(state: WorkflowState) -> dict[str, Any]:
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

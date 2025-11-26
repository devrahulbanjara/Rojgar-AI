from typing import Dict, Any
from loguru import logger

from ..llm_service import get_llm
from ..schemas import WorkflowState
from app.core.config import settings
from ..templates import DEGREE_MAPPER_PROMPT


def evaluate_degree(state: WorkflowState) -> Dict[str, Any]:
    logger.info("Evaluating degrees")
    llm = get_llm()
    chain = DEGREE_MAPPER_PROMPT | llm

    evaluations = []

    for item in state["structured_resumes"]:
        resume = item["data"]
        degree_text = resume.education[0]["degree"] if resume.education else "Unknown"

        mapped = chain.invoke({"degree": degree_text})
        qualification = getattr(mapped, "content", str(mapped)).strip().strip('"')
        score = settings.DEGREE_WEIGHTS.get(qualification, 5)

        justification = f"Degree '{degree_text}' mapped to category '{qualification}' with weight {score}/10"

        evaluations.append(
            {
                "source_file": item["source_file"],
                "score": score,
                "degree": qualification,
                "justification": justification,
            }
        )

    return {"degree_evaluations": evaluations}

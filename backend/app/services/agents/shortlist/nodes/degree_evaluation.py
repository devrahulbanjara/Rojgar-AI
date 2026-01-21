from typing import Any

from langsmith import traceable

from app.core import logger
from app.models.agents.shortlist import WorkflowState

from ..constants import DEGREE_WEIGHTS
from ..llm_service import get_llm
from ..templates import DEGREE_MAPPER_PROMPT


@traceable(
    name="shortlist_evaluate_degree_node",
    tags=["node:evaluate_degree", "shortlist"],
    metadata={"node_type": "evaluate_degree", "purpose": "evaluate_qualification"},
)
def evaluate_degree(state: WorkflowState) -> dict[str, Any]:
    logger.info("Evaluating degrees")
    llm = get_llm()
    chain = DEGREE_MAPPER_PROMPT | llm

    evaluations = []

    for item in state["structured_resumes"]:
        resume = item["data"]
        degree_text = resume.education[0].degree if resume.education else "Unknown"

        mapped = chain.invoke({"degree": degree_text})
        qualification = getattr(mapped, "content", str(mapped)).strip().strip('"')
        score = DEGREE_WEIGHTS.get(qualification, 5)

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

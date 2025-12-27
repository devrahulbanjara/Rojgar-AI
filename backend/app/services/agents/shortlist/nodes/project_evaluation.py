import json
from typing import Any

from langsmith import traceable

from app.core import logger
from app.models.agents.shortlist import EvaluationScore, WorkflowState

from ..llm_service import get_llm
from ..templates import PROJECT_EVALUATION_PROMPT


@traceable(
    name="shortlist_evaluate_projects_node",
    tags=["node:evaluate_projects", "shortlist"],
    metadata={
        "node_type": "evaluate_projects",
        "purpose": "evaluate_project_alignment",
    },
)
def evaluate_projects(state: WorkflowState) -> dict[str, Any]:
    logger.info("Evaluating projects")
    job_desc = state["job_description_text"]

    llm = get_llm()
    chain = PROJECT_EVALUATION_PROMPT | llm.with_structured_output(EvaluationScore)

    evaluations = []

    for item in state["structured_resumes"]:
        resume = item["data"]

        if not resume.projects:
            evaluations.append(
                {
                    "source_file": item["source_file"],
                    "score": 0,
                    "justification": "No projects listed",
                }
            )
            continue

        result = chain.invoke(
            {
                "job_desc": job_desc,
                "projects": json.dumps(resume.projects, indent=2),
            }
        )

        evaluations.append(
            {
                "source_file": item["source_file"],
                "score": result.score,
                "justification": result.justification,
            }
        )

    return {"project_evaluations": evaluations}

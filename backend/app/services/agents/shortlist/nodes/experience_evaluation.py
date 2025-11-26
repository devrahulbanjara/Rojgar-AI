from typing import Dict, Any
from loguru import logger
from ..schemas import WorkflowState


def evaluate_experience_years(state: WorkflowState) -> Dict[str, Any]:
    logger.info("Evaluating experience years")
    job_req = state["job_requirements"]
    evaluations = []

    for item in state["structured_resumes"]:
        resume = item["data"]

        score = (
            min(resume.years_experience / job_req.years_required, 1) * 10
            if job_req.years_required > 0
            else 10
        )

        if resume.years_experience >= job_req.years_required:
            justification = f"Has {resume.years_experience} years of experience, meeting the required {job_req.years_required} years"
        else:
            justification = f"Has {resume.years_experience} years of experience, below the required {job_req.years_required} years"

        evaluations.append(
            {
                "source_file": item["source_file"],
                "score": round(score, 2),
                "years": resume.years_experience,
                "justification": justification,
            }
        )

        logger.success(
            f"Experience evaluated for {item['source_file']}: "
            f"{resume.years_experience} years ({score:.2f}/10)"
        )

    return {"experience_evaluations": evaluations}
